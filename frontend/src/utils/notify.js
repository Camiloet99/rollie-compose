import { toast } from "react-toastify";

export const notify = {
  success: (m) => toast.success(m, { autoClose: 2200 }),
  error:   (m) => toast.error(m,   { autoClose: 2600 }),
  info:    (m) => toast.info(m,    { autoClose: 2000 }),
};
