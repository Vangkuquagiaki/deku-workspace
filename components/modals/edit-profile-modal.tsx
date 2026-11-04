"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Check, Image as ImageIcon, Loader2, ShieldCheck, Sparkles, Upload, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { UserAvatar } from "@/components/user-avatar";
import { FileUpload } from "@/components/file-upload";

const formSchema = z.object({
  name: z.string().min(1, { message: "Tên hiển thị không được để trống." }),
  imageUrl: z.string().min(1, { message: "Ảnh đại diện không được để trống." })
});

const DEFAULT_AVATARS = [
  {
    name: "Quản lý / Team Lead",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop"
  },
  {
    name: "Chuyên viên / Executive",
    url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop"
  },
  {
    name: "Kỹ sư / Specialist",
    url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop"
  },
  {
    name: "Điều phối viên / Coordinator",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop"
  },
  {
    name: "Nhân sự / HR Representative",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop"
  }
];

export function EditProfileModal() {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();
  const [uploadMode, setUploadMode] = useState<"presets" | "upload" | "url">("presets");

  const isModalOpen = isOpen && type === "editProfile";
  const profile = data?.profile || data?.member?.profile;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      imageUrl: ""
    }
  });

  useEffect(() => {
    if (profile) {
      form.setValue("name", profile.name || "");
      form.setValue("imageUrl", profile.imageUrl || "");
    }
  }, [profile, form]);

  const isLoading = form.formState.isSubmitting;
  const currentName = form.watch("name") || profile?.name || "User";
  const currentAvatar = form.watch("imageUrl") || profile?.imageUrl || "";

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch("/api/profile", values);
      form.reset();
      onClose();
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1e1f22] text-zinc-200 p-0 overflow-hidden max-w-lg border border-zinc-800 shadow-2xl rounded-2xl">
        <DialogHeader className="pt-6 px-6">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-x-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            Hồ sơ Nhân sự (Corporate Profile)
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Cập nhật tên hiển thị công việc và ảnh đại diện trong hệ thống nội bộ.
          </DialogDescription>
        </DialogHeader>

        {/* Live Preview Card */}
        <div className="mx-6 mt-1 p-3 bg-[#111214] rounded-xl border border-zinc-800/80">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Xem trước hồ sơ (Live Preview)
          </p>
          <div className="flex items-center gap-x-3">
            <div className="relative">
              <UserAvatar
                src={currentAvatar}
                className="h-14 w-14 border-2 border-indigo-500 shadow-md"
              />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#111214]" />
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-sm text-white truncate">
                {currentName}
              </h4>
              <p className="text-xs text-zinc-400 truncate">
                {profile?.email || "nhansu@congty.internal"}
              </p>
              <div className="inline-flex items-center text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.5 rounded mt-1 font-medium">
                Nhân sự chính thức
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-6 pb-6">
            {/* Display Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="uppercase text-xs font-bold text-zinc-300">
                    Tên hiển thị (Display Name)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <Input
                        disabled={isLoading}
                        placeholder="Nhập tên hiển thị mới"
                        className="bg-[#111214] border-zinc-700/80 focus-visible:ring-indigo-500 text-zinc-200 pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            {/* Avatar Selector Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="uppercase text-xs font-bold text-zinc-300">
                  Ảnh đại diện (Avatar)
                </label>
                {/* Tabs to pick method */}
                <div className="flex items-center gap-x-1 bg-[#111214] p-1 rounded-lg border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadMode("presets")}
                    className={`px-2 py-0.5 rounded transition ${
                      uploadMode === "presets"
                        ? "bg-indigo-600 text-white font-medium"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Mẫu có sẵn
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("upload")}
                    className={`px-2 py-0.5 rounded transition ${
                      uploadMode === "upload"
                        ? "bg-indigo-600 text-white font-medium"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Tải tệp lên
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("url")}
                    className={`px-2 py-0.5 rounded transition ${
                      uploadMode === "url"
                        ? "bg-indigo-600 text-white font-medium"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Link URL
                  </button>
                </div>
              </div>

              {/* Mode 1: Presets */}
              {uploadMode === "presets" && (
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {DEFAULT_AVATARS.map((item) => {
                    const isSelected = form.watch("imageUrl") === item.url;
                    return (
                      <button
                        key={item.url}
                        type="button"
                        onClick={() => form.setValue("imageUrl", item.url)}
                        className={`group relative rounded-xl overflow-hidden border-2 p-0.5 transition hover:scale-105 ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/50"
                            : "border-zinc-700/60 hover:border-zinc-500"
                        }`}
                      >
                        <UserAvatar
                          src={item.url}
                          className="h-12 w-12 rounded-lg"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-600/40 backdrop-blur-[1px] flex items-center justify-center">
                            <Check className="h-4 w-4 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mode 2: File Upload (UploadThing) */}
              {uploadMode === "upload" && (
                <div className="bg-[#111214] p-3 rounded-xl border border-zinc-800">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileUpload
                            endpoint="serverImage"
                            value={field.value}
                            onChange={(url) => {
                              if (url) field.onChange(url);
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Mode 3: Direct URL Input */}
              {uploadMode === "url" && (
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                          <Input
                            disabled={isLoading}
                            placeholder="https://example.com/avatar.png"
                            className="bg-[#111214] border-zinc-700/80 focus-visible:ring-indigo-500 text-zinc-200 pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-rose-400" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isLoading}
                onClick={handleClose}
                className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
