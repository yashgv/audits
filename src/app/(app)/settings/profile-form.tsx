"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { profileSchema } from "@/lib/validations";
import { updateProfileAction } from "@/app/actions/investigations";

type Values = z.infer<typeof profileSchema>;

export function ProfileForm({ name, org }: { name: string; org: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name, org },
  });

  const onSubmit = handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Profile saved");
      router.refresh();
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" placeholder="Ananya Rao" {...register("name")} />
          <FieldError>{errors.name?.message}</FieldError>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="org">Organisation</Label>
          <Input id="org" placeholder="Finance controls team" {...register("org")} />
          <FieldError>{errors.org?.message}</FieldError>
        </div>
      </div>

      <Button type="submit" disabled={pending || !isDirty}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Save changes
      </Button>
    </form>
  );
}
