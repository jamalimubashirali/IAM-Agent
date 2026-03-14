import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import api from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(4, { message: "Password must be at least 4 characters." }),
})

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const response = await api.post("/auth/signin", values)
      const userData = response.data;
      
      // Strict Check: Must be Admin
      if (!userData.roles.includes("ROLE_ADMIN")) {
        toast.error("Access Denied: You are not an administrator.")
        return;
      }

      login(userData)
      toast.success("Admin Login successful")
      navigate("/admin/users") // Redirect directly to Admin Dashboard
    } catch (error: any) {
      console.error(error)
      const message = error.response?.data?.message || "Login failed"
      toast.error(message)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <Card className="w-full max-w-md border-red-800 bg-gray-950 text-white">
        <CardHeader>
          <CardTitle className="text-red-500">Admin Portal</CardTitle>
          <CardDescription className="text-gray-400">Restricted Access. Authorized Personnel Only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter admin username" {...field} className="bg-gray-800 border-gray-700 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} className="bg-gray-800 border-gray-700 text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Admin Sign In</Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
            <p className="text-sm text-gray-500">
              Not an admin?{" "}
              <Link to="/login" className="text-blue-400 hover:underline">
                Go to User Login
              </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  )
}
