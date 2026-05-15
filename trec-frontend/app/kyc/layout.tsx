import EtheralBackground from "../../components/EtheralBackground";

export default function KycLayout({
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
