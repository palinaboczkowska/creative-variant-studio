import { designSize } from "@/lib/formats";
import { ctaRadius, fontFamily, type BannerStyle } from "@/lib/style";
import type { AdFormat, BannerImage, Copy } from "@/lib/types";
import styles from "./page.module.css";

// How much of the banner a side image takes unless the designer changes it.
export function defaultImageShare(format: AdFormat): number {
  return format.width / format.height > 3 ? 25 : 45;
}

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
  // Text size follows the space left for text, so a big side image means smaller text.
  const textShare =
    image?.layout === "side"
      ? 1 - (image.share ?? defaultImageShare(format)) / 100
      : 1;
  const textArea = tall
    ? { width: design.width, height: design.height * textShare }
    : { width: design.width * textShare, height: design.height };

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
          color: look.text,
          fontFamily: fontFamily(look.font),
          fontSize:
            headlineSize(textArea.width, textArea.height, wide) *
            look.textScale,
        }}
      >
        {image?.layout === "background" && (
          <div className={styles.bannerBackground}>
            <BannerPhoto image={image} />
            <div className={styles.bannerShade} />
          </div>
        )}
        {image?.layout === "side" && (
          <div
            className={styles.bannerImage}
            style={{
              flexBasis: `${image.share ?? defaultImageShare(format)}%`,
            }}
          >
            <BannerPhoto image={image} />
          </div>
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

function BannerPhoto({ image }: { image: BannerImage }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- uploaded images are served by our own API
    <img
      src={`/api/images/${image.id}`}
      alt=""
      className={styles.photo}
      style={{
        objectFit: image.fit ?? "cover",
        transform: `scale(${(image.zoom ?? 100) / 100})`,
      }}
    />
  );
}

function headlineSize(width: number, height: number, wide: boolean): number {
  const size = wide ? height * 0.3 : Math.min(width, height) * 0.12;
  return Math.min(56, Math.max(18, size));
}
