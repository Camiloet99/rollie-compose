import { CrmProvider } from "./CrmProvider";
import CrmLayout from "./CrmLayout";

export default function AdminCrm() {
  return (
    <CrmProvider>
      <CrmLayout />
    </CrmProvider>
  );
}
