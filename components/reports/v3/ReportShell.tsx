import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { REPORT_FOOTER } from '@/lib/reportTemplateV3';

const LOGO_PATH = path.join(process.cwd(), 'public', 'brand', 'theaim-logo-full-color.png');
const LOGO_HEIGHT = 32;
const LOGO_WIDTH = (LOGO_HEIGHT * 791) / 484;

export const theme = {
  ink: '#1f2933',
  muted: '#6b7280',
  line: '#e5e7eb',
  softText: '#4b5563',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 46,
    paddingHorizontal: 32,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: theme.ink,
  },
  blob: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  top: {
    position: 'absolute',
    top: 12,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  badge: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  kicker: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.ink,
    lineHeight: 1.15,
  },
  accent: {
    width: 28,
    height: 4,
    borderRadius: 2,
    marginTop: 5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: theme.softText,
    marginTop: 2,
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: theme.line,
    paddingTop: 4,
    fontSize: 8,
    color: theme.muted,
  },
});

function headerBrand() {
  if (fs.existsSync(LOGO_PATH)) {
    return <Image src={LOGO_PATH} style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }} />;
  }
  return <Text style={[styles.brand, { color: '#B61213' }]}>theaim.id</Text>;
}

function ReportChrome({ badgeColor }: { badgeColor: string }) {
  return (
    <>
      <View style={styles.top} fixed>
        {headerBrand()}
        <Text
          style={[styles.badge, { backgroundColor: badgeColor }]}
          render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`}
        />
      </View>
      <Text style={styles.footer} fixed>
        {REPORT_FOOTER}
      </Text>
    </>
  );
}

export function ReportPage({
  accent,
  soft,
  kicker,
  title,
  subtitle,
  children,
}: {
  accent: string;
  soft: string;
  kicker: string;
  title: string;
  subtitle?: string | null;
  children: React.ReactNode;
}) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <View style={[styles.blob, { backgroundColor: soft }]} />
      <ReportChrome badgeColor={accent} />
      <View>
        <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={{ marginTop: 8 }}>{children}</View>
    </Page>
  );
}

/** Continuing page for every test section and the closing block. */
export function FlowPage({ children }: { children: React.ReactNode }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <ReportChrome badgeColor="#1D1D1D" />
      {children}
    </Page>
  );
}

export function SectionBlock({
  accent,
  kicker,
  title,
  subtitle,
  lead,
  children,
}: {
  accent: string;
  kicker: string;
  title: string;
  subtitle?: string | null;
  /** Small block kept with the title so the heading is not left alone. */
  lead?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 8, marginBottom: 4 }}>
      <View wrap={lead ? false : undefined} minPresenceAhead={lead ? undefined : 72}>
        <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.accent, { backgroundColor: accent }]} />
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {lead ? <View style={{ marginTop: 6 }}>{lead}</View> : null}
      </View>
      {children ? <View style={{ marginTop: 6 }}>{children}</View> : null}
    </View>
  );
}

export const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopWidth: 3,
    marginBottom: 6,
  },
  plain: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.line,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  icon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: theme.ink,
  },
  body: {
    fontSize: 8.5,
    color: theme.ink,
    lineHeight: 1.4,
  },
  sectionLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: theme.ink,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.ink,
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 2,
  },
});

export function IconHeading({
  accent,
  icon,
  title,
}: {
  accent: string;
  icon: string;
  title: string;
}) {
  return (
    <View style={cardStyles.head}>
      <View style={[cardStyles.icon, { backgroundColor: accent }]}>
        <Text style={cardStyles.iconText}>{icon}</Text>
      </View>
      <Text style={cardStyles.cardTitle}>{title}</Text>
    </View>
  );
}
