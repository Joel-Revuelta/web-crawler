package types

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// JSONMap is a custom type for map[string]int to handle JSON serialization.
type JSONMap map[string]int

func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return json.Marshal(make(map[string]int))
	}
	return json.Marshal(m)
}

func (m *JSONMap) Scan(value interface{}) error {
	source, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(source, &m)
}
