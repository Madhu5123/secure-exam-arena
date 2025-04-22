
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DepartmentManager } from "@/components/department/DepartmentManager";

const Department = () => {
  return (
    <DashboardLayout>
      <DepartmentManager />
    </DashboardLayout>
  );
};

export default Department;
