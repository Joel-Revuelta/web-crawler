import { toast } from "sonner";

const toastOptions = {
  duration: 5000,
  position: "top-right",
} as const;

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    ...toastOptions,
    style: {
      background: "#e0f2f1",
      color: "#004d40",
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    ...toastOptions,
    style: {
      background: "#fdecea",
      color: "#b91c1c",
    },
  });
};
