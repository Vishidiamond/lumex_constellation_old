import { useEffect, useState } from "react";

const menuItems = [
  {
    text: "Lumex Group rises as the cosmic balance between disruption and creation-championing a brand new era of diamonds.",
    cta: "https://lumexgroup.com/",
    label: "Lumex",
  },
  {
    text: "Atelier Amara celebrates fluidity of being human-our innovative jewels inspire unique expressions of individuality.",
    cta: "https://atelieramara.com/",
    label: "Atelier Amara",
  },
  {
    text: "Nsphere is a futurist creation blueprint that weaves together technology & artistry to generate designs at scale.",
    cta: "https://nsphere.ai/",
    label: "Nsphere",
  },
  {
    text: "With Uncertify.ai we are defying the status quo by democratizing the value of your diamond, and giving the power back to you!",
    cta: "https://uncertify.ai/",
    label: "Uncertify.ai",
  },
  {
    text: "Fortunoff is a legacy reborn; a take on the classic to now make it iconic!",
    cta: "https://www.fortunoff.com/",
    label: "Fortunoff",
  },
  {
    text: "Lumex.Online emerging as the north star guides the entire diamond eco-system together onto one digital commerce platform unlike ever before.",
    cta: "https://lumex.online/",
    label: "Lumex.Online",
  },
];

export default function Header({ show }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverText, setHoverText] = useState("");
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 780) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper: dispatch a focus event (instead of navigating immediately)
  const handleFocusClick = (e, item) => {
    // Prevent navigation — we want to focus first
    e.preventDefault();

    // dispatch custom event to be handled by the 3D scene
    window.dispatchEvent(
      new CustomEvent("focus-logo", {
        detail: {
          label: item.label,
          cta: item.cta,
        },
      })
    );

    // Optional: if you want to still open CTA after a delay, uncomment:
    // setTimeout(() => window.open(item.cta, "_blank", "noopener"), 900);
  };

  return (
    <>
      {show ? (
        <div className="headerWrap">
          <header className="header" role="banner">
            <button
              className="hamburger"
              aria-expanded={menuOpen}
              aria-controls="mainNav"
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>

            <nav
              id="mainNav"
              role="navigation"
              className={menuOpen ? "show" : "hide"}
            >
              <ul className={`navList `}>
                {menuItems.map((item, i) => (
                  <li key={i} className="navItem">
                    <a
                      href={item.cta}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="navLink"
                      onClick={(e) => handleFocusClick(e, item)}
                    >
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </header>
        </div>
      ) : null}
    </>
  );
}
