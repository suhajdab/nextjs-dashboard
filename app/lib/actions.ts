"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["paid", "pending"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export default async function createInvoice(formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const { customerId, amount, status } = CreateInvoice.parse(rawFormData);

    const amountInCents = amount * 100;
    const date = new Intl.DateTimeFormat("sv-SE").format(new Date());

    const data = await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      RETURNING *;
    `;
    console.log("✅ Created Invoice", { ...data.rows[0] });

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    console.error("🛑 Error creating invoice", error);
    throw "Database Error: Failed to Create Invoice.";
  }
  redirect("/dashboard/invoices");
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  try {
    const rawFormData = Object.fromEntries(formData.entries());
    const { customerId, amount, status } = UpdateInvoice.parse(rawFormData);

    const amountInCents = amount * 100;

    const data = await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
      RETURNING *;
    `;
    console.log("✅ Updated Invoice", { ...data.rows[0] });

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    console.error("🛑 Error updating invoice", error);
    throw "Database Error: Failed to Update Invoice.";
  }
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
      DELETE FROM invoices
      WHERE id = ${id};
    `;
    console.log("✅ Deleted Invoice", { id });

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    console.error("🛑 Error deleting invoice", error);
    throw "Database Error: Failed to Delete Invoice.";
  }
}
