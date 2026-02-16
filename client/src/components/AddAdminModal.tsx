import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "./ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UserPlus } from "lucide-react";
import { apiRequest } from "../lib/config.ts";

interface AddAdminModalProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddAdminModal({ children, onSuccess }: AddAdminModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiRequest<{ message?: string }>({ 
        endpoint: "/api/admin/add-admin", 
        method: "POST", 
        data: { 
          name: formData.name,
          email: formData.email,
          role: formData.role
        } 
      });
      
      // Reset form and close modal on success
      setFormData({ name: "", email: "", role: "" });
      setOpen(false);
      onSuccess?.();
      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to add admin:", error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#0a0a0a]/90 backdrop-blur-xl border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-full bg-[#8a3ffc]/20">
               <UserPlus className="w-5 h-5 text-[#8a3ffc]" />
            </div>
            Add Administrator
          </DialogTitle>
          <DialogDescription className="text-white/50">
            Invite a new administrator to the dashboard. They will receive an email to set up their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
             {/* Name */}
             <div className="grid gap-2">
                <Label htmlFor="name" className="text-white/70">Full Name</Label>
                <Input 
                    id="name" 
                    placeholder="Enter full name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#8a3ffc]"
                    required
                />
             </div>
             
             {/* Email */}
             <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/70">Email Address</Label>
                <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@nexura.io" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#8a3ffc]"
                    required
                />
             </div>
             
             {/* Role */}
             <div className="grid gap-2">
                <Label htmlFor="role" className="text-white/70">Role Permission</Label>
                 <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[#8a3ffc]">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                      <SelectItem value="super_admin" className="focus:bg-white/10 focus:text-white">Super Admin</SelectItem>
                      <SelectItem value="admin" className="focus:bg-white/10 focus:text-white">Admin</SelectItem>
                      <SelectItem value="moderator" className="focus:bg-white/10 focus:text-white">Moderator</SelectItem>
                    </SelectContent>
                 </Select>
             </div>
        </form>

        <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/5">Cancel</Button>
            </DialogClose>
            <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-gradient-to-r from-[#8a3ffc] to-[#522696] text-white rounded-md hover:opacity-90 transition-opacity shadow-[0px_0px_15px_rgba(138,63,252,0.4)]"
            >
                {loading ? "Sending Invitation..." : "Send Invitation"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}