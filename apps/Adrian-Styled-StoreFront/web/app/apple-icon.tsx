import { ImageResponse } from "next/og";

export const size = {
    width: 512,
    height: 512,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
                    color: "#d4af37",
                    fontFamily: "Georgia, serif",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 34,
                        border: "14px solid #d4af37",
                        borderRadius: 110,
                        opacity: 0.95,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 58,
                        border: "6px solid #e4c266",
                        borderRadius: 92,
                        opacity: 0.9,
                    }}
                />
                <span
                    style={{
                        position: "relative",
                        fontSize: 250,
                        fontWeight: 700,
                        lineHeight: 1,
                        color: "#e2c15b",
                    }}
                >
                    A
                </span>
            </div>
        ),
        size,
    );
}
