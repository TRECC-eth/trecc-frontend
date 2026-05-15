import EtheralBackground from "../../components/EtheralBackground";

export default function CreateAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EtheralBackground />
      {children}
    </>
  );
}
