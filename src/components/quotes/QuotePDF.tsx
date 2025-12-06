import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 9,
    color: '#4b5563',
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    flex: 1,
    color: '#4b5563',
  },
  table: {
    marginTop: 15,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    color: '#1f2937',
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  colDescription: {
    flex: 3,
  },
  colArea: {
    flex: 1,
    textAlign: 'right',
  },
  colPrice: {
    flex: 1,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: '#4b5563',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#dcfce7',
    borderTopWidth: 2,
    borderTopColor: '#16a34a',
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#15803d',
  },
  financingSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 4,
  },
  financingTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 10,
  },
  financingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  financingLabel: {
    fontSize: 9,
    color: '#166534',
  },
  financingValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#166534',
  },
  financingMonthly: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#16a34a',
  },
  financingMonthlyLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#15803d',
  },
  financingMonthlyValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d',
  },
  financingNote: {
    fontSize: 7,
    color: '#166534',
    marginTop: 8,
    fontStyle: 'italic',
  },
  termsSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  termsText: {
    fontSize: 8,
    lineHeight: 1.5,
    color: '#4b5563',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: 200,
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 30,
    color: '#4b5563',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#9ca3af',
    paddingTop: 5,
  },
  signatureName: {
    fontSize: 8,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

interface QuotePDFProps {
  quote: {
    quoteNumber: string;
    date: string;
    validUntil: string;
  };
  company: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string;
    email: string;
    kvkNumber?: string;
    btwNumber?: string;
    logoUrl?: string;
  };
  customer: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone?: string;
    email?: string;
  };
  project: {
    title: string;
    address: string;
    description?: string;
  };
  lineItems: Array<{
    description: string;
    area_m2: number;
    price_per_m2: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
  financing?: {
    loanAmount: number;
    term: number;
    interestRate: number;
    monthlyPayment: number;
  };
  terms?: {
    payment?: string;
    conditions?: string;
  };
}

export default function QuotePDF({
  quote,
  company,
  customer,
  project,
  lineItems,
  totals,
  financing,
  terms,
}: QuotePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            {company.logoUrl ? (
              <Image src={company.logoUrl} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb' }}>
                {company.name}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>OFFERTE</Text>
            <Text style={styles.companyInfo}>{company.name}</Text>
            <Text style={styles.companyInfo}>{company.address}</Text>
            <Text style={styles.companyInfo}>
              {company.postalCode} {company.city}
            </Text>
            <Text style={styles.companyInfo}>{company.phone}</Text>
            <Text style={styles.companyInfo}>{company.email}</Text>
            {company.kvkNumber && (
              <Text style={styles.companyInfo}>KVK: {company.kvkNumber}</Text>
            )}
            {company.btwNumber && (
              <Text style={styles.companyInfo}>BTW: {company.btwNumber}</Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 30 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Klantgegevens</Text>
            <Text style={{ fontSize: 10, marginBottom: 2, fontWeight: 'bold' }}>
              {customer.name}
            </Text>
            <Text style={{ fontSize: 9, color: '#4b5563', marginBottom: 2 }}>
              {customer.address}
            </Text>
            <Text style={{ fontSize: 9, color: '#4b5563', marginBottom: 2 }}>
              {customer.postalCode} {customer.city}
            </Text>
            {customer.phone && (
              <Text style={{ fontSize: 9, color: '#4b5563', marginBottom: 2 }}>
                {customer.phone}
              </Text>
            )}
            {customer.email && (
              <Text style={{ fontSize: 9, color: '#4b5563' }}>{customer.email}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Offerte nr:</Text>
              <Text style={styles.value}>{quote.quoteNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Datum:</Text>
              <Text style={styles.value}>{quote.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Geldig tot:</Text>
              <Text style={styles.value}>{quote.validUntil}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
            {project.title}
          </Text>
          <Text style={{ fontSize: 9, color: '#4b5563', marginBottom: 4 }}>
            {project.address}
          </Text>
          {project.description && (
            <Text style={{ fontSize: 9, color: '#4b5563', lineHeight: 1.4 }}>
              {project.description}
            </Text>
          )}
        </View>

        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Werkzaamheden</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Omschrijving</Text>
            <Text style={styles.colArea}>m²</Text>
            <Text style={styles.colPrice}>€/m²</Text>
            <Text style={styles.colTotal}>Subtotaal</Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colArea}>{item.area_m2.toFixed(2)}</Text>
              <Text style={styles.colPrice}>€{item.price_per_m2.toFixed(2)}</Text>
              <Text style={styles.colTotal}>€{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotaal excl. BTW</Text>
            <Text style={styles.totalValue}>€{totals.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>BTW 21%</Text>
            <Text style={styles.totalValue}>€{totals.vat.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>TOTAAL incl. BTW</Text>
            <Text style={styles.grandTotalValue}>€{totals.total.toFixed(2)}</Text>
          </View>
          {totals.subsidy > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#15803d' }]}>ISDE Subsidie (RVO)</Text>
                <Text style={[styles.totalValue, { color: '#15803d' }]}>- €{totals.subsidy.toFixed(2)}</Text>
              </View>
              <View style={[styles.grandTotal, { backgroundColor: '#dcfce7', borderColor: '#16a34a' }]}>
                <Text style={[styles.grandTotalLabel, { color: '#15803d' }]}>TE BETALEN na subsidie</Text>
                <Text style={[styles.grandTotalValue, { color: '#15803d' }]}>€{totals.totalAfterSubsidy.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {financing && (
          <View style={styles.financingSection}>
            <Text style={styles.financingTitle}>Financiering via Nationaal Warmtefonds</Text>
            <View style={styles.financingRow}>
              <Text style={styles.financingLabel}>Leenbedrag:</Text>
              <Text style={styles.financingValue}>€{financing.loanAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.financingRow}>
              <Text style={styles.financingLabel}>Looptijd:</Text>
              <Text style={styles.financingValue}>{financing.term} jaar</Text>
            </View>
            <View style={styles.financingRow}>
              <Text style={styles.financingLabel}>Rente:</Text>
              <Text style={styles.financingValue}>{financing.interestRate.toFixed(2)}% per jaar</Text>
            </View>
            <View style={styles.financingMonthly}>
              <Text style={styles.financingMonthlyLabel}>Maandlast:</Text>
              <Text style={styles.financingMonthlyValue}>€{financing.monthlyPayment.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <Text style={styles.financingNote}>
              Rentetarieven Nationaal Warmtefonds per 16 mei 2025. Indicatieve berekening, onder voorbehoud van goedkeuring.
            </Text>
          </View>
        )}

        {terms?.payment && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Betalingsvoorwaarden</Text>
            <Text style={styles.termsText}>{terms.payment}</Text>
          </View>
        )}

        {terms?.conditions && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Algemene Voorwaarden</Text>
            <Text style={styles.termsText}>{terms.conditions}</Text>
          </View>
        )}

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Handtekening klant:</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>{customer.name}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Handtekening aannemer:</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>{company.name}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          {company.name} | {company.phone} | {company.email}
        </Text>
      </Page>
    </Document>
  );
}
