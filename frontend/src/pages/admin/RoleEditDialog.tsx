import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { type Role, type Permission } from "@/types"
import api from "@/lib/api"
import { toast } from "sonner"

const roleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  permissions: z.array(z.number()), // array of permission IDs
})

interface RoleEditDialogProps {
  role: Role | null // If null, create mode (though name might be locked for edit?)
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleUpdated: () => void
}

export default function RoleEditDialog({ role, open, onOpenChange, onRoleUpdated }: RoleEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
    values: role ? {
        name: role.name,
        permissions: role.permissions.map(p => p.id)
    } : {
        name: "",
        permissions: []
    }
  })

  useEffect(() => {
      if (open) {
          fetchPermissions()
      }
  }, [open])

  const fetchPermissions = async () => {
      try {
          const res = await api.get('/roles/permissions')
          setAllPermissions(res.data)
      } catch (e) {
          console.error(e)
          toast.error("Failed to load permissions")
      }
  }

  async function onSubmit(values: z.infer<typeof roleSchema>) {
    setIsLoading(true)
    try {
      // Map IDs back to objects if backend expects them, or just IDs wrapped in object
      // Backend updateRole endpoint I wrote expects Set<Permission> where Permission has ID.
      const payload = {
          name: values.name,
          permissions: values.permissions.map(id => ({ id }))
      }

      if (role) {
          await api.put(`/roles/${role.id}`, payload)
          toast.success("Role updated successfully")
      } else {
          await api.post('/roles', payload)
          toast.success("Role created successfully")
      }
      onRoleUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to save role")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            Configure role details and permissions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!!role} /> 
                  </FormControl>
                  {/* Disable name edit for existing roles to prevent breaking code refs? Optional. */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Permissions</FormLabel>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border p-4 rounded-md h-60 overflow-y-auto">
                    {allPermissions.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {item.name}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
