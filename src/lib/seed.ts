import type { BusinessProfile, Client, Invoice } from "../types"

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export const businessProfile: BusinessProfile = {
  name: "Northwind Creative Agency",
  email: "hello@northwindcreative.com",
  phone: "+1 (415) 555-0182",
  address: "482 Market Street, Suite 300\nSan Francisco, CA 94105",
  currency: "USD",
  logoInitial: "N",
}

export const seedClients: Client[] = [
  {
    id: "c1",
    name: "Priya Nair",
    company: "Lumen Interiors",
    email: "priya@lumeninteriors.com",
    phone: "+1 (212) 555-0134",
    address: "88 Greene St, New York, NY 10012",
    createdAt: daysAgo(210),
  },
  {
    id: "c2",
    name: "Marcus Chen",
    company: "Fieldstone Realty",
    email: "marcus@fieldstonerealty.com",
    phone: "+1 (312) 555-0199",
    address: "410 W Huron St, Chicago, IL 60654",
    createdAt: daysAgo(180),
  },
  {
    id: "c3",
    name: "Elena Torres",
    company: "Brightloop Media",
    email: "elena@brightloop.io",
    phone: "+1 (512) 555-0147",
    address: "1200 Barton Springs Rd, Austin, TX 78704",
    createdAt: daysAgo(150),
  },
  {
    id: "c4",
    name: "Sam Whitfield",
    company: "Whitfield & Co Law",
    email: "sam@whitfieldlaw.com",
    phone: "+1 (206) 555-0161",
    address: "701 5th Ave, Seattle, WA 98104",
    createdAt: daysAgo(95),
  },
  {
    id: "c5",
    name: "Aiko Tanaka",
    company: "Kaeru Studio",
    email: "aiko@kaerustudio.com",
    phone: "+1 (415) 555-0122",
    address: "55 Hawthorne St, San Francisco, CA 94105",
    createdAt: daysAgo(60),
  },
  {
    id: "c6",
    name: "Tomás Rivera",
    company: "Rivera Home Services",
    email: "tomas@riverahome.com",
    phone: "+1 (305) 555-0177",
    address: "220 Biscayne Blvd, Miami, FL 33132",
    createdAt: daysAgo(30),
  },
]

function items(...rows: [string, number, number, number][]) {
  return rows.map(([description, quantity, unitPrice, taxRate], i) => ({
    id: `li${i}`,
    description,
    quantity,
    unitPrice,
    taxRate,
  }))
}

export const seedInvoices: Invoice[] = [
  {
    id: "inv1",
    number: "INV-1042",
    clientId: "c1",
    issueDate: daysAgo(3),
    dueDate: daysFromNow(11),
    items: items(["Brand identity design", 1, 3200, 0], ["Style guide document", 1, 800, 0]),
    discount: 0,
    notes: "Thank you for the opportunity to work on your rebrand.",
    paymentTerms: "Net 14",
    status: "sent",
    createdAt: daysAgo(3),
    sentAt: daysAgo(3),
  },
  {
    id: "inv2",
    number: "INV-1041",
    clientId: "c2",
    issueDate: daysAgo(5),
    dueDate: daysFromNow(9),
    items: items(["Listing photography (half day)", 1, 450, 8.5], ["Drone footage add-on", 1, 175, 8.5]),
    discount: 25,
    notes: "",
    paymentTerms: "Net 14",
    status: "paid",
    createdAt: daysAgo(5),
    sentAt: daysAgo(5),
    paidAt: daysAgo(2),
  },
  {
    id: "inv3",
    number: "INV-1040",
    clientId: "c3",
    issueDate: daysAgo(30),
    dueDate: daysAgo(16),
    items: items(["Social media management — August", 1, 1800, 0], ["Paid ad campaign setup", 1, 600, 0]),
    discount: 0,
    notes: "Includes 3 platforms and weekly reporting.",
    paymentTerms: "Net 14",
    status: "sent",
    createdAt: daysAgo(30),
    sentAt: daysAgo(30),
  },
  {
    id: "inv4",
    number: "INV-1039",
    clientId: "c4",
    issueDate: daysAgo(12),
    dueDate: daysFromNow(2),
    items: items(["Website maintenance retainer", 1, 950, 0]),
    discount: 0,
    notes: "",
    paymentTerms: "Net 14",
    status: "sent",
    createdAt: daysAgo(12),
    sentAt: daysAgo(12),
  },
  {
    id: "inv5",
    number: "INV-1038",
    clientId: "c5",
    issueDate: daysAgo(20),
    dueDate: daysAgo(6),
    items: items(["Logo design package", 1, 1450, 0]),
    discount: 100,
    notes: "10% loyalty discount applied.",
    paymentTerms: "Net 14",
    status: "paid",
    createdAt: daysAgo(20),
    sentAt: daysAgo(20),
    paidAt: daysAgo(10),
  },
  {
    id: "inv6",
    number: "INV-1037",
    clientId: "c6",
    issueDate: daysAgo(45),
    dueDate: daysAgo(31),
    items: items(["Kitchen remodel consultation", 4, 95, 0], ["Materials estimate report", 1, 220, 0]),
    discount: 0,
    notes: "",
    paymentTerms: "Net 14",
    status: "paid",
    createdAt: daysAgo(45),
    sentAt: daysAgo(45),
    paidAt: daysAgo(38),
  },
  {
    id: "inv7",
    number: "INV-1043",
    clientId: "c1",
    issueDate: daysAgo(1),
    dueDate: daysFromNow(13),
    items: items(["Packaging design — round 2", 1, 1200, 0]),
    discount: 0,
    notes: "",
    paymentTerms: "Net 14",
    status: "draft",
    createdAt: daysAgo(1),
  },
  {
    id: "inv8",
    number: "INV-1036",
    clientId: "c3",
    issueDate: daysAgo(60),
    dueDate: daysAgo(46),
    items: items(["Social media management — July", 1, 1800, 0]),
    discount: 0,
    notes: "",
    paymentTerms: "Net 14",
    status: "paid",
    createdAt: daysAgo(60),
    sentAt: daysAgo(60),
    paidAt: daysAgo(52),
  },
]
