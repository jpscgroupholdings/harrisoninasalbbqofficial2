'use client';

import React from "react";
import SectionHeader from "../../components/SectionHeader";
import InventoryTable from "./InventoryTable";

const ClientPage = () => {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Inventory Management"
        subTitle="Manage your branch's inventory"
        btnTxt="Add an item"
      />

      <InventoryTable />
    </div>
  );
};

export default ClientPage;
