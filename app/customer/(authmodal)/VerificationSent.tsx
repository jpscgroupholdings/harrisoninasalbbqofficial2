import { DynamicIcon } from "@/components/ui/DynamicIcon";

type VerificationSentProps = {
  emailHint: string;
};

export function VerificationSent({ emailHint }: VerificationSentProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50">
        <div className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-50" />
        <DynamicIcon
          name="MailCheck"
          size={88}
          className="relative z-10 text-green-500"
        />
      </div>
      <h2 className="text-lg font-semibold">Check your email</h2>
      <p className="text-sm text-gray-600">
        Account created. We sent a verification link to{" "}
        <span className="text-red-500">{emailHint || "your email"}</span>.
        Please verify your email before signing in.
      </p>
    </div>
  );
}
