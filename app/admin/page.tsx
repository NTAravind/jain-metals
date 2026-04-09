import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Package2, Users, IndianRupee } from "lucide-react"

export default async function AdminDashboard() {
  const [orderCount, productCount, customerCount, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
  ])

  const stats = [
    { title: "Total Orders", value: orderCount, icon: ShoppingCart },
    { title: "Active Products", value: productCount, icon: Package2 },
    { title: "Customers", value: customerCount, icon: Users },
    {
      title: "Revenue",
      value: `₹${Number(revenue._sum.total ?? 0).toLocaleString("en-IN")}`,
      icon: IndianRupee,
    },
  ]

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-bold text-black tracking-tighter">Foundry Overview</h1>
        <p className="text-black/40 mt-1.5 font-bold uppercase tracking-[0.2em] text-[10px]">Real-time Status of Jain Metals</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.title} className="bg-white border border-black/5 rounded-3xl shadow-xl shadow-black/[0.02] overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-3 px-8 pt-8">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-black/30">
                {s.title}
              </CardTitle>
              <div className="p-2.5 bg-black/[0.03] rounded-2xl group-hover:bg-black transition-colors duration-300">
                <s.icon className="w-4 h-4 text-black group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <p className="text-4xl font-bold text-black tracking-tighter tabular-nums">{s.value}</p>
              <div className="w-12 h-1 bg-black/5 rounded-full mt-4 group-hover:w-20 group-hover:bg-black transition-all duration-500" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
