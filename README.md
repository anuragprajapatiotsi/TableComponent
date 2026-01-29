# Advanced Data Table

A **plug-and-play, reusable data table component** built for modern React / Next.js applications.
Designed with a **compact grid layout**, **ellipsis handling**, **column sorting via a three-dot menu**, and a **simple config-driven API** — inspired by **shadcn/ui**.

---

## ✨ Features

* 📦 Installable via **shadcn CLI**
* 🧩 Plug-and-play (no internal edits required)
* 📐 Compact grid-style layout
* 📏 Fixed row height & column width
* ✂️ Ellipsis (`...`) for overflowing cell content
* 👀 Full cell value visible on hover
* 🔢 `123` indicator for numeric columns
* 🔤 `ABC` indicator for string columns
* ⋮ Three-dot menu per column
* ↕️ Sort Ascending / Descending
* 🧠 Strongly typed with TypeScript

---

## 📦 Installation

Add the component using the **shadcn CLI**:

```bash
npx shadcn@latest add https://<your-domain>/registry/advanced-data-table.json
```

### Example

```bash
npx shadcn@latest add https://advanced-data-table.vercel.app/registry/advanced-data-table.json
```

This command will automatically:

* Install required dependencies:

  * `@tanstack/react-table`
  * `lucide-react`
* Install required shadcn UI primitives (`table`, `button`, etc.)
* Add the component to:

```
components/ui/advanced-data-table.tsx
```

---

## 🚀 Usage

### 1️⃣ Import the Component

```tsx
import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
```

---

### 2️⃣ Define Columns (Configuration-Driven)

Create a `columns.ts` file **next to your page or feature**.

```ts
// columns.ts
import { ColumnConfig } from "@/components/ui/advanced-data-table";

type User = {
  id: number;
  name: string;
  email: string;
};

export const columns: ColumnConfig<User>[] = [
  {
    key: "id",
    label: "ID",
    type: "number", // shows 123
    sortable: true,
  },
  {
    key: "name",
    label: "Name",
    type: "string", // shows ABC
    sortable: true,
  },
  {
    key: "email",
    label: "Email",
    type: "string",
    sortable: true,
  },
];
```

---

### 3️⃣ Provide Data

```ts
// data.ts
export const data = [
  {
    id: 1,
    name: "Anurag Prajapati",
    email: "anurag@email.com",
  },
  {
    id: 2,
    name: "John Doe",
    email: "john@email.com",
  },
];
```

---

### 4️⃣ Render the Table

```tsx
import { AdvancedDataTable } from "@/components/ui/advanced-data-table";
import { columns } from "./columns";
import { data } from "./data";

export default function UsersPage() {
  return (
    <AdvancedDataTable
      columns={columns}
      data={data}
    />
  );
}
```

That’s it 🎉
No additional setup required.

---

## 🧠 ColumnConfig API

```ts
type ColumnConfig<T> = {
  key: keyof T;          // Data field key
  label: string;         // Column header
  type: "string" | "number";
  sortable?: boolean;    // Enable/disable sorting
};
```

---

## ⚙️ Optional Props

```tsx
<AdvancedDataTable
  columns={columns}
  data={data}
  rowHeight={32}
  columnWidth={140}
  defaultSort={{ key: "id", direction: "asc" }}
/>
```

---

## 📁 Recommended Folder Structure

```
app/
 └─ users/
     ├─ page.tsx
     ├─ columns.ts
     └─ data.ts
```

---

## 🧠 Design Philosophy

* **Simple public API**
* **No TanStack types exposed**
* **Config in, behavior out**
* **Reusable across projects**
* **shadcn-style developer experience**

---

## 🛠 Built With

* React
* TypeScript
* @tanstack/react-table
* shadcn/ui
* Tailwind CSS

---

## 📄 License

MIT
