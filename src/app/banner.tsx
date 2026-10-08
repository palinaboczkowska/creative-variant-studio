import { designSize } from "@/lib/formats";
import { ctaRadius, fontFamily, type BannerStyle } from "@/lib/style";
import type { AdFormat, BannerImage, Copy } from "@/lib/types";
import styles from "./page.module.css";

// Draws a banner at a realistic size and scales it down to fit the card.
export default function Banner({
  copy,
  format,
  look,
  image,
}: {
  copy: Copy;
  format: AdFormat;
  look: BannerStyle;
  image?: BannerImage;
}) {
  const wide = format.width / format.height > 3;
  const tall = format.height / format.width > 1.3;
  const design = designSize(format.width, format.height);
  const scale = Math.min(300 / design.width, 220 / design.height);
  const url = image ? `/api/images/${image.id}` : null;
  const asBackground = url && image?.layout === "background";
  const asSide = url && image?.layout === "side";

  return (
    <div style={{ width: design.width * scale, height: design.height * scale }}>
      <div
        className={styles.banner}
        style={{
          width: design.width,
          height: design.height,
          transform: `scale(${scale})`,
          flexDirection: tall ? "column" : "row",
          borderRadius: look.radius,
          backgroundColor: look.background,
          backgroundImage: asBackground
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${url})`
            : undefined,
          color: look.text,
          fontFamily: fontFamily(look.font),
          fontSize:
            headlineSize(design.width, design.height, wide) * look.textScale,
        }}
      >
        {asSide && (
          <div
            className={styles.bannerImage}
            style={{
              backgroundImage: `url(${url})`,
              flexBasis: wide ? "25%" : "45%",
            }}
          />
        )}
        <div
          className={wide ? styles.previewWide : styles.preview}
          style={{
            textAlign: look.align,
            alignItems: wide
              ? "center"
              : look.align === "center"
                ? "center"
                : "flex-start",
          }}
        >
          <strong>{copy.headline}</strong>
          <span
            className={styles.cta}
            style={{
              background: look.ctaBackground,
              color: look.ctaText,
              borderRadius: ctaRadius(look.ctaShape),
            }}
          >
            {copy.cta}
          </span>
        </div>
      </div>
    </div>
  );
}

function headlineSize(width: number, height: number, wide: boolean): number {
  const size = wide ? height * 0.3 : Math.min(width, height) * 0.12;
  return Math.min(56, Math.max(18, size));
}
