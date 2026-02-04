/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // ชี้ไปที่โฟลเดอร์ src ของเรา
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // เผื่อใช้ App Router
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // เผื่อใช้ Pages Router
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
