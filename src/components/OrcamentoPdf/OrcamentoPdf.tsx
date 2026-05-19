import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const brand = {
  bg: "#ffffff",
  bgCard: "#f8fafc",
  bgCardAlt: "#f1f5f9",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#64748b",
  textFaint: "#94a3b8",
  sky: "#0284c7",
  skyLight: "#e0f2fe",
  skyBorder: "#7dd3fc",
  skyText: "#0369a1",
  green: "#15803d",
  greenLight: "#dcfce7",
  greenBorder: "#86efac",
  red: "#b91c1c",
  redLight: "#fee2e2",
  redBorder: "#fca5a5",
  amber: "#b45309",
  amberLight: "#fef3c7",
  amberBorder: "#fcd34d",
  gray: "#475569",
  grayLight: "#f8fafc",
  grayBorder: "#cbd5e1",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: brand.bg,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: brand.sky,
  },
  headerLeft: { flex: 1 },
  // logo: altura fixa, largura proporcional. Ajuste maxWidth/height aqui se necessário
  logo: {
    height: 50,
    width: "auto",
    maxWidth: 180,
    marginBottom: 12,
    objectFit: "contain",
  },
  titulo: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 10,
    color: brand.textMuted,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: brand.bgCard,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 8,
    padding: 14,
  },
  cardLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brand.textFaint,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 11,
    color: brand.text,
    marginBottom: 3,
  },
  cardValueMuted: {
    fontSize: 10,
    color: brand.textMuted,
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: brand.textFaint,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: brand.bgCard,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 8,
    marginBottom: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  itemHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  itemIndex: {
    fontSize: 9,
    color: brand.textFaint,
    width: 16,
  },
  itemDescricao: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
  },
  itemDetalhe: {
    fontSize: 9,
    color: brand.textMuted,
    marginTop: 4,
    lineHeight: 1.5,
  },
  itemValor: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: brand.sky,
    minWidth: 80,
    textAlign: "right",
  },
  obsCard: {
    backgroundColor: brand.bgCard,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  obsText: {
    fontSize: 10,
    color: brand.textMuted,
    lineHeight: 1.6,
  },
  totalCard: {
    backgroundColor: brand.skyLight,
    borderWidth: 1,
    borderColor: brand.skyBorder,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: brand.skyText,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalValor: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: brand.sky,
  },
  totalRight: {
    alignItems: "flex-end",
  },
  totalRightText: {
    fontSize: 9,
    color: brand.skyText,
    marginBottom: 2,
  },
  assinaturaSection: {
    flexDirection: "row",
    gap: 40,
    marginTop: 8,
  },
  assinaturaBox: {
    flex: 1,
    alignItems: "center",
  },
  assinaturaLinha: {
    width: "100%",
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    marginBottom: 8,
  },
  assinaturaLabel: {
    fontSize: 9,
    color: brand.text,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  assinaturaSubLabel: {
    fontSize: 8,
    color: brand.textFaint,
    textAlign: "center",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: brand.borderLight,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: brand.textFaint,
  },
});

// ─── tipos vindos da página de detalhe ───
type ItemFuncionarioRaw = {
  id: string;
  meses_alocados: number;
  salario_snapshot: number;
};

type OrcamentoItem = {
  id: string;
  descricao: string;
  descricao_detalhada: string | null;
  valor_manual: number | null;
  orcamento_item_funcionarios: ItemFuncionarioRaw[];
};

type ClienteData = {
  nome: string;
  email: string | null;
  cpf_cnpj: string | null;
  logradouro: string | null;
  numero: string | null;
  cidade: string | null;
  estado: string | null;
};

// breakdown vindo do helper (calcularOrcamento)
type CalculoResultado = {
  custoEquipe: number;
  valorBuffer: number;
  custoProtegido: number;
  valorMargem: number;
  subtotal: number;
  valorImposto: number;
  valorCalculado: number;
  valorCobrado: number;
  somaItens: number | null;
  divergencia: number;
  temDivergencia: boolean;
};

// equipe consolidada vinda da página de detalhe (não é renderizada no PDF
// mas tipo continua aqui pra compatibilidade da interface)
type EquipeConsolidada = {
  id: number;
  name: string;
  salario: number;
  meses: number;
  total: number;
};

type OrcamentoPDFProps = {
  numero: number | null;
  titulo: string;
  status: string;
  tipo: "projeto_fechado" | "por_modulo";
  cliente: ClienteData | null;
  margem_lucro: number;
  aliquota_imposto: number;
  buffer_atraso: number;
  validade_dias: number;
  observacoes: string | null;
  created_at: string;
  orcamento_itens: OrcamentoItem[];
  equipeConsolidada: EquipeConsolidada[];
  calculo: CalculoResultado;
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// resolve URL absoluta da logo (next.js serve /public na raiz)
function getLogoSrc(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/gnoq2026.png`;
  }
  // fallback pra SSR (caso seja renderizado no server algum dia)
  return "/gnoq2026.png";
}

export function OrcamentoPDF({
  numero,
  titulo,
  tipo,
  cliente,
  validade_dias,
  observacoes,
  created_at,
  orcamento_itens,
  calculo,
}: OrcamentoPDFProps) {
  const validade = new Date(created_at);
  validade.setDate(validade.getDate() + validade_dias);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* cabeçalho da empresa */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={getLogoSrc()} style={styles.logo} />

            <Text
              style={{ fontSize: 9, color: brand.textMuted, marginBottom: 2 }}
            >
              CNPJ: 57.738.857/0001-20
            </Text>
            <Text
              style={{ fontSize: 9, color: brand.textMuted, marginBottom: 2 }}
            >
              Rua das Indústrias, 500 — Novo Eldorado — Contagem/MG — CEP
              32341-490
            </Text>
            <Text
              style={{ fontSize: 9, color: brand.textMuted, marginBottom: 2 }}
            >
              (31) 99452-5631 · gabriel.neves@gnoq.com.br
            </Text>
            <Text style={{ fontSize: 9, color: brand.sky }}>
              www.gnoq.com.br
            </Text>
          </View>

          <View
            style={{
              alignItems: "flex-end",
              backgroundColor: brand.skyLight,
              borderWidth: 1,
              borderColor: brand.skyBorder,
              borderRadius: 8,
              padding: 14,
              minWidth: 150,
            }}
          >
            <Text
              style={{
                fontSize: 8,
                fontFamily: "Helvetica-Bold",
                color: brand.textFaint,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              Orçamento
            </Text>
            <Text
              style={{
                fontSize: 22,
                fontFamily: "Helvetica-Bold",
                color: brand.sky,
                marginBottom: 10,
              }}
            >
              #{String(numero ?? 0).padStart(4, "0")}
            </Text>
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: brand.skyBorder,
                paddingTop: 8,
                width: "100%",
                alignItems: "flex-end",
              }}
            >
              <Text
                style={{ fontSize: 8, color: brand.skyText, marginBottom: 3 }}
              >
                Data de emissão
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "Helvetica-Bold",
                  color: brand.skyText,
                }}
              >
                {new Date().toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </View>
        </View>

        {/* título */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View>
            <Text style={styles.titulo}>{titulo}</Text>
            <Text style={styles.subtitulo}>
              Válido até {validade.toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        {/* cliente */}
        <View style={styles.infoRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Dados do cliente</Text>
            <Text style={styles.cardValue}>{cliente?.nome ?? "—"}</Text>
            {cliente?.cpf_cnpj && (
              <Text style={styles.cardValueMuted}>{cliente.cpf_cnpj}</Text>
            )}
            {cliente?.email && (
              <Text style={styles.cardValueMuted}>{cliente.email}</Text>
            )}
            {cliente?.logradouro && (
              <Text style={styles.cardValueMuted}>
                {cliente.logradouro}, {cliente.numero} — {cliente.cidade}/
                {cliente.estado}
              </Text>
            )}
          </View>
        </View>

        {/* itens / módulos */}
        <Text style={styles.sectionLabel}>
          {tipo === "por_modulo" ? "Módulos" : "Escopo do projeto"}
        </Text>
        {orcamento_itens.map((item, index) => (
          <View key={item.id} style={styles.itemCard} wrap={false}>
            <View style={styles.itemHeaderLeft}>
              <Text style={styles.itemIndex}>{index + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDescricao}>
                  {item.descricao || "(sem descrição)"}
                </Text>
                {item.descricao_detalhada && (
                  <Text style={styles.itemDetalhe}>
                    {item.descricao_detalhada}
                  </Text>
                )}
              </View>
            </View>
            {tipo === "por_modulo" && item.valor_manual != null && (
              <Text style={styles.itemValor}>
                {formatBRL(item.valor_manual)}
              </Text>
            )}
          </View>
        ))}

        {/* total */}
        <View style={styles.totalCard} wrap={false}>
          <View>
            <Text style={styles.totalLabel}>Valor do projeto</Text>
            <Text style={styles.totalValor}>
              {formatBRL(calculo.valorCobrado)}
            </Text>
          </View>
          <View style={styles.totalRight}>
            <Text style={styles.totalRightText}>
              Criado em {new Date(created_at).toLocaleDateString("pt-BR")}
            </Text>
            <Text style={styles.totalRightText}>
              Válido até {validade.toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        {/* observações */}
        {observacoes && (
          <View wrap={false} style={styles.obsCard}>
            <Text style={styles.cardLabel}>
              Condições de pagamento e observações
            </Text>
            <Text style={styles.obsText}>{observacoes}</Text>
          </View>
        )}

        {/* assinaturas */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Assinaturas</Text>
        <View wrap={false} style={styles.assinaturaSection}>
          <View style={styles.assinaturaBox}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>
              {cliente?.nome ?? "Contratante"}
            </Text>
            {cliente?.cpf_cnpj && (
              <Text style={styles.assinaturaSubLabel}>{cliente.cpf_cnpj}</Text>
            )}
            <Text style={styles.assinaturaSubLabel}>Contratante</Text>
          </View>
          <View style={styles.assinaturaBox}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>
              GNOQ — Global Node of Quantum
            </Text>
            <Text style={styles.assinaturaSubLabel}>
              CNPJ: 57.738.857/0001-20
            </Text>
            <Text style={styles.assinaturaSubLabel}>Contratada</Text>
          </View>
        </View>

        {/* rodapé */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>GNOQ — Global Node of Quantum</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
