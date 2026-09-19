// AdminLayout.jsx
import { useState } from "react";
import AdminHeader from "./Header";

function AdminLayout({ user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <AdminHeader user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main
        style={{
          marginTop: 64,
          marginLeft: window.innerWidth > 900 ? (sidebarOpen ? 240 : 76) : 0,
          transition: "margin-left 0.2s ease",
        }}
      >
        {children}
      </main>
    </>
  );
}

export default AdminLayout;