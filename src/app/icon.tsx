import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
    width: 512,
    height: 512,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 320,
                    background: "#10B981", // Emerald-500
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    borderRadius: "0px", // App icons usually handle masking, but we can do rounded rect
                }}
            >
                {/* We can't import Lucide directly in Edge runtime easily without full SVG. 
            So we paste the check-circle SVG path here for the icon. 
            Lucide 'Check' icon.
        */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="320"
                    height="320"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            </div>
        ),
        // ImageResponse options
        {
            // For convenience, we can re-use the exported icons size metadata
            // config to also set the ImageResponse's width and height.
            ...size,
        }
    );
}
