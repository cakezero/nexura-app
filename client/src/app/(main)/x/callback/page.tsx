"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequestV2 } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

function XCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const x_id = searchParams.get("x_id");
    const username = searchParams.get("username");

    if (!x_id || !username) {
      alert("No id or username returned from server.");
      router.push("/profile/edit"); // redirect to edit profile if values is missing
      return;
    }

    // update user
    (async () => {
      try {
        const { user } = await apiRequestV2("GET", `/api/x/update?x_id=${x_id}&username=${username}`);

        setUser(user);

        toast({ title: "Success", description: "X login successful!" });
        router.push("/profile/edit")
      } catch (error: any) {
        console.error(error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        router.push("/profile/edit");
      }
    })();

    // fetch(`/api/discord/join`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ code }),
    // })
    //   .then((res) => res.json())
    //   .then((data) => {
    //     if (data.success) {
    //       alert("Successfully joined X!");
    //     } else {
    //       alert("Failed to join X server.");
    //     }
    //     setLocation("/campaigns"); // always go back to campaigns page
    //   })
    //   .catch((err) => {
    //     console.error(err);
    //     alert("Something went wrong.");
    //     setLocation("/campaigns");
    //   });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-white bg-black">
      <p className="text-lg">Processing X connection... </p>
      <br />
      <p className="text-lg">Do not refresh</p>
    </div>
  );
}

export default function XCallback() {
  return (
    <Suspense fallback={null}>
      <XCallbackInner />
    </Suspense>
  );
}
