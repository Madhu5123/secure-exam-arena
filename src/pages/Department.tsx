
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ref, get, push, set } from 'firebase/database';
import { db } from '@/config/firebase';
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
