import { ImageResponse } from "next/og";

export const size = {
    width: 512,
    height: 512,
};

export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    background: "#111111",
                    borderRadius: 120,
                    fontFamily: "Georgia, serif",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 28,
                        border: "16px solid #d4af37",
                        borderRadius: 106,
                    }}
                />
                <span
                    style={{
                        position: "relative",
                        fontSize: 320,
                        fontWeight: 800,
                        lineHeight: 0.9,
                        letterSpacing: "-0.08em",
                        color: "#e6c35c",
                        transform: "translateY(-6px)",
                    }}
                >
                    A
                </span>
            </div>
        ),
        size,
    );
}
