import { Card, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function ConnectedTwitter() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black text-white space-y-8">

      {/* Outer Card */}
      <Card className="bg-gray-900 border border-purple-500 rounded-2xl w-full max-w-xl p-6 space-y-6">

        {/* Connect Check Icon */}
        <div className="flex justify-center">
          <img
            src="/connect-check.png"
            alt="Connected Check"
            className="w-16 h-16"
          />
        </div>

{/* Title */}
<h1 className="text-2xl sm:text-3xl font-semibold text-white text-center">
  X Account Connected
</h1>

{/* Subtitle */}
<p className="text-white/60 text-center sm:text-base max-w-sm mx-auto">
  Your X account has been successfully linked to Nexura Studio
</p>

        {/* Inner Card: Logo + Project Info + Verified + Button */}
        <Card className="bg-gray-800 border border-purple-500 rounded-2xl p-4 flex items-center justify-between">
          {/* Logo with border */}
<div className="border-2 border-purple-500 rounded-2xl p-2 flex items-center justify-center">
  <img
    src="/x-logo.png"
    alt="X logo"
    className="w-10 h-10"
  />
</div>


{/* Project Info */}
<div className="flex items-center justify-between flex-1 px-4">
  {/* Project name + handle */}
  <div className="flex flex-col">
    <span className="text-white font-semibold text-lg">
      @indomieproject_shawarma
    </span>
    <span className="text-white/60 text-sm">
      Primary Handle
    </span>
  </div>

  {/* Verified icon */}
  <img
    src="/verified-icon.png"
    alt="Verified"
    className="w-24 h-8"
  />
</div>
        </Card>

{/* Action Button */}
<Link href="/studio-dashboard" className="w-full">
  <Button className="w-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center gap-2 mt-4">
    Save & Continue
    <ArrowRight className="h-5 w-5" />
  </Button>
</Link>


      </Card>

    </div>
  );
}
