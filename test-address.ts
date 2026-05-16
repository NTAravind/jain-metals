import { z } from "zod";

const AddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().regex(/^\+?[0-9]{10,13}$/, "Invalid phone"),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  country: z.string().default("India"),
})

const form = new FormData();
form.append("fullName", "Test User");
form.append("phone", "+919876543210");
form.append("line1", "Test Line 1");
form.append("line2", "");
form.append("city", "Test City");
form.append("state", "Test State");
form.append("pincode", "123456");

try {
  const obj = Object.fromEntries(form);
  const data = AddressSchema.parse(obj);
  console.log("Success:", data);
} catch(e: any) {
  console.log("Error:", e.issues);
}
