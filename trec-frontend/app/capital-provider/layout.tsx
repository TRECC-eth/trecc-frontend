import EtheralBackground from "../../components/EtheralBackground";

export default function CapitalProviderLayout({
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
