package crawler

import (
	"errors"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"time"
	"web-crawler/backend/models"

	"github.com/gocolly/colly"
	"gorm.io/gorm"
)

var ErrCrawlCancelled = errors.New("crawl cancelled by user")

type Service struct {
	DB *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{DB: db}
}

func (s *Service) ProcessURL(website *models.Website, cancelChan <-chan struct{}) error {
	c := colly.NewCollector(
		colly.UserAgent("web-crawler"),
		colly.Async(true),
	)

	c.Limit(&colly.LimitRule{
		DomainGlob:  "*",
		Parallelism: 8,
	})

	var (
		requestProcessed int32
		requestCount     int32
	)

	baseURL, err := url.Parse(website.URL)
	if err != nil {
		log.Printf("Failed to parse base URL %s: %v", website.URL, err)
		website.Status = models.Failed
		if dbErr := s.DB.Save(website).Error; dbErr != nil {
			log.Printf("Failed to save failed status for website %d: %v", website.ID, dbErr)
		}
		return err
	}

	result := &crawlResult{
		headings: make(map[string]int32),
	}

	c.OnRequest(func(r *colly.Request) {
		select {
		case <-cancelChan:
			log.Printf("Cancellation requested for %s. Aborting request.", r.URL.String())
			r.Abort()
			atomic.StoreInt32(&result.crawlCancelled, 1)
		default:
			atomic.AddInt32(&requestCount, 1)
		}
	})

	c.OnResponse(func(r *colly.Response) {
		atomic.AddInt32(&requestProcessed, 1)
		if r.StatusCode >= 400 {
			log.Printf("Crawl failed for %s with status code: %d", r.Request.URL, r.StatusCode)
			atomic.StoreInt32(&result.crawlFailed, 1)
			return
		}
		result.htmlVersion = detectHTMLVersion(r.Body)
	})

	// links extraction and categorization
	c.OnHTML("a[href]", func(e *colly.HTMLElement) {
		link := e.Attr("href")
		absoluteURL := e.Request.AbsoluteURL(link)

		if absoluteURL == "" {
			return
		}

		linkURL, err := url.Parse(absoluteURL)
		if err != nil {
			atomic.AddInt32(&result.brokenLinks, 1)
			return
		}

		if linkURL.Hostname() == baseURL.Hostname() {
			atomic.AddInt32(&result.internalLinks, 1)
		} else {
			atomic.AddInt32(&result.externalLinks, 1)
		}

		go checkLink(absoluteURL, &result.brokenLinks)
	})

	// Extract page title
	c.OnHTML("title", func(e *colly.HTMLElement) {
		result.mu.Lock()
		result.pageTitle = e.Text
		result.mu.Unlock()
	})

	// Count headings
	c.OnHTML("h1, h2, h3, h4, h5, h6", func(e *colly.HTMLElement) {
		result.mu.Lock()
		result.headings[e.Name]++
		result.mu.Unlock()
	})

	// Check for a login form
	c.OnHTML("form", func(e *colly.HTMLElement) {
		// Check for password field, a strong indicator of a login form
		if e.ChildAttr("input[type='password']", "name") != "" {
			atomic.StoreInt32(&result.hasLoginForm, 1)
		}
	})

	// Handle errors during crawling
	c.OnError(func(r *colly.Response, err error) {
		log.Printf("Crawl failed for %s (status code: %d): %v", r.Request.URL, r.StatusCode, err)
		atomic.StoreInt32(&result.crawlFailed, 1)
		atomic.AddInt32(&requestProcessed, 1)
	})

	// Finalize and save results after the crawl is complete
	c.OnScraped(func(r *colly.Response) {
		log.Printf("Crawl completed for %s", r.Request.URL)

		if atomic.LoadInt32(&result.crawlFailed) != 0 {
			website.Status = models.Failed
		} else if atomic.LoadInt32(&result.crawlCancelled) != 0 {
			website.Status = models.Cancelled
		} else {
			website.Status = models.Completed
		}

		result.mu.RLock()
		defer result.mu.RUnlock()

		website.Title = result.pageTitle
		website.HTMLVersion = result.htmlVersion
		website.InternalLinks = int(atomic.LoadInt32(&result.internalLinks))
		website.ExternalLinks = int(atomic.LoadInt32(&result.externalLinks))
		website.BrokenLinks = int(atomic.LoadInt32(&result.brokenLinks))
		website.HasLoginForm = atomic.LoadInt32(&result.hasLoginForm) == 1

		headingsCount := make(map[string]int)
		for k, v := range result.headings {
			headingsCount[k] = int(v)
		}
		website.HeadingsCount = headingsCount

		if err := s.DB.Save(website).Error; err != nil {
			log.Printf("Failed to save website data for %s: %v", website.URL, err)
		}
	})

	if err := c.Visit(website.URL); err != nil {
		log.Printf("Failed to start visit for URL %s: %v", website.URL, err)
		website.Status = models.Failed
		if dbErr := s.DB.Save(website).Error; dbErr != nil {
			log.Printf("Failed to save failed status for website %d: %v", website.ID, dbErr)
		}
		return err
	}

	c.Wait()

	if atomic.LoadInt32(&result.crawlCancelled) != 0 {
		return ErrCrawlCancelled
	}

	if atomic.LoadInt32(&result.crawlFailed) != 0 {
		return errors.New("crawling failed")
	}
	return nil
}

type crawlResult struct {
	mu             sync.RWMutex
	pageTitle      string
	htmlVersion    string
	headings       map[string]int32
	internalLinks  int32
	externalLinks  int32
	brokenLinks    int32
	hasLoginForm   int32
	crawlFailed    int32
	crawlCancelled int32
}

func detectHTMLVersion(body []byte) string {
	bodyStr := strings.ToLower(string(body))
	if strings.Contains(bodyStr, "<!doctype html>") {
		return "HTML5"
	}
	if strings.Contains(bodyStr, "html 4.01") {
		return "HTML4"
	}
	if strings.Contains(bodyStr, "xhtml") {
		return "XHTML"
	}
	return "Unknown or older"
}

func checkLink(url string, brokenLinks *int32) {
	client := http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Head(url)
	if err != nil {
		atomic.AddInt32(brokenLinks, 1)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 && resp.StatusCode < 600 {
		atomic.AddInt32(brokenLinks, 1)
	}
}
