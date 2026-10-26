import { Text } from "@/components/i18n";
import { ArrowUpRight, Check, Droplets, GraduationCap, MapPin, Sprout, Users } from "lucide-react";
export function IndiaNetwork({ open, resolved }: { open: number; resolved: number }) {
  return (
    <div
      className="network-scene"
      aria-label="An illustrated network of civic innovation across India"
    >
      <div className="network-grid" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="map-heading">
        <span className="live-dot" /> <Text>{"A nation of possibilities"}</Text>
      </div>
      <svg
        className="india-map"
        viewBox="0 0 420 460"
        fill="none"
        role="img"
        aria-label="India innovation network"
      >
        <defs>
          <linearGradient
            id="india-fill"
            x1="80"
            y1="0"
            x2="320"
            y2="450"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#efefef" />
            <stop offset="1" stopColor="#d3d3d3" />
          </linearGradient>
          <pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="1" fill="#a9a9a9" opacity=".55" />
          </pattern>
        </defs>
        <path
          d="M143 22l19 8 14-5 16 16-4 14 17 6-8 18 21 12 4 17 18 3 11 24 21 3 16 16 32-5 17 8 17-12 20 3 8-10 20 7-8 21-23 12-9 28-17-2-6-21-18 9-5 22-16 7-7 26-19 21-10 35-18 16-6 31-16 26-9 43-12 36-11 25-14-9-14-27-13-33-9-31-8-18-9-23-15-16-11-24-24-10-18-17-8-26 15-4 2-19 16-10-6-16 17-13 3-24 15-17-5-22 17-18-8-18 12-13-4-19 12-8-3-19z"
          fill="url(#india-fill)"
          stroke="#b8b8b8"
          strokeWidth="1.5"
        />
        <path
          d="M143 22l19 8 14-5 16 16-4 14 17 6-8 18 21 12 4 17 18 3 11 24 21 3 16 16 32-5 17 8 17-12 20 3 8-10 20 7-8 21-23 12-9 28-17-2-6-21-18 9-5 22-16 7-7 26-19 21-10 35-18 16-6 31-16 26-9 43-12 36-11 25-14-9-14-27-13-33-9-31-8-18-9-23-15-16-11-24-24-10-18-17-8-26 15-4 2-19 16-10-6-16 17-13 3-24 15-17-5-22 17-18-8-18 12-13-4-19 12-8-3-19z"
          fill="url(#dots)"
        />
        <g stroke="#b8b8b8" opacity=".65" strokeWidth="1">
          <path d="M115 104l38 14 35-10 26 21 37 6M91 150l38 12 28-17 25 14 36-6 25 25 29 4M68 196l40 12 19-19 36 8 33-20 20 25 29 10M92 250l31-13 43 5 27-21 35 10M121 291l34-9 33 16 26-15M145 335l34-8 20 12M163 379l22-10M153 118l4 27M129 162l-2 27M182 159l-19 38 3 45M196 177l-3 44M155 282l11-40M188 298l-9 29M179 327l-16 52" />
        </g>
        <g stroke="#888888" strokeWidth="1.5" strokeDasharray="4 5">
          <path d="M155 123Q80 190 117 259T176 360M155 123Q249 166 243 219T176 360M117 259Q166 198 243 219" />
        </g>
        <g fill="#ffffff" stroke="#656565" strokeWidth="3">
          <circle cx="155" cy="123" r="7" />
          <circle cx="117" cy="259" r="7" />
          <circle cx="243" cy="219" r="6" />
          <circle cx="176" cy="360" r="7" />
          <circle cx="163" cy="201" r="5" />
        </g>
        <g fill="#585858" fontSize="10" fontFamily="Arial,sans-serif">
          <text x="168" y="119">
            <Text>{"NEW DELHI"}</Text>
          </text>
          <text x="69" y="281">
            <Text>{"MUMBAI"}</Text>
          </text>
          <text x="190" y="363">
            <Text>{"BENGALURU"}</Text>
          </text>
          <text x="252" y="223">
            <Text>{"KOLKATA"}</Text>
          </text>
        </g>
      </svg>
      <div className="network-card network-card-top">
        <span className="mini-icon blue">
          <GraduationCap size={19} />
        </span>
        <div>
          <strong>
            <Text>{"Bright minds. Shared purpose."}</Text>
          </strong>
          <small>
            <Text>{"Connecting campuses to communities"}</Text>
          </small>
        </div>
        <span className="floating-check">
          <Check size={12} />
        </span>
      </div>
      <div className="network-card network-card-left">
        <span className="mini-icon teal">
          <Droplets size={18} />
        </span>
        <div>
          <small>
            <Text>{"From a local challenge"}</Text>
          </small>
          <strong>
            <Text>{"Water for every village"}</Text>
          </strong>
          <span className="mini-status">
            <span /> <Text>{"Open for innovation"}</Text>
          </span>
        </div>
      </div>
      <div className="network-card network-card-right">
        <span className="mini-icon warm">
          <Sprout size={19} />
        </span>
        <div>
          <small>
            <Text>{"To a real-world solution"}</Text>
          </small>
          <strong>
            <Text>{"Smarter farming. Better lives."}</Text>
          </strong>
          <span className="mini-status">
            <Check size={12} /> <Text>{"Community powered"}</Text>
          </span>
        </div>
      </div>
      <div className="network-bottom">
        <span className="network-avatars">
          <i>
            <Text>{"AS"}</Text>
          </i>
          <i>
            <Text>{"PK"}</Text>
          </i>
          <i>
            <Text>{"RM"}</Text>
          </i>
          <i>
            <Users size={12} />
          </i>
        </span>
        <div>
          <strong>
            {open} <Text>{" challenges. Endless possibilities."}</Text>
          </strong>
          <small>
            {resolved} <Text>{" resolved through collective action"}</Text>
          </small>
        </div>
        <ArrowUpRight size={18} />
      </div>
      <span className="map-disclaimer">
        <Text>{"Illustration · not a geographic boundary reference"}</Text>
      </span>
    </div>
  );
}
