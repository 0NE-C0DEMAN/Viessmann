// Single source of truth for app translations.
//
// Flat-key dictionary keeps it greppable and easy to refactor. Every string
// the installer-facing flow needs is here; the admin side stays English in
// this phase (Frane's boss demo is the installer side).
//
// To add a string: add a key here in both languages, then call `t("key")` from
// a server component (await getT() first) or `useT()` from a client component.

export type Locale = "en" | "hr";

type Entry = { en: string; hr: string };
type Dict = Record<string, Entry>;

export const dict: Dict = {
  // ----- Common -----
  "common.cancel":            { en: "Cancel",                                   hr: "Odustani" },
  "common.save":              { en: "Save",                                     hr: "Spremi" },
  "common.saving":            { en: "Saving…",                                  hr: "Spremanje…" },
  "common.saved":             { en: "Saved",                                    hr: "Spremljeno" },
  "common.continue":          { en: "Continue",                                 hr: "Nastavi" },
  "common.back":              { en: "Back",                                     hr: "Natrag" },
  "common.signOut":           { en: "Sign out",                                 hr: "Odjava" },
  "common.points":            { en: "points",                                   hr: "bodova" },
  "common.pts":               { en: "pts",                                      hr: "bod." },
  "common.loading":           { en: "Loading…",                                 hr: "Učitavanje…" },
  "common.networkError":      { en: "Network error",                            hr: "Mrežna greška" },
  "common.searchPlaceholder": { en: "Search…",                                  hr: "Pretraži…" },

  // ----- Status pills -----
  "status.approved":          { en: "Approved",                                 hr: "Odobreno" },
  "status.needs_review":      { en: "Pending review",                           hr: "Na pregledu" },
  "status.rejected":          { en: "Rejected",                                 hr: "Odbijeno" },
  "status.duplicate":         { en: "Duplicate",                                hr: "Duplikat" },

  // ----- Tiers -----
  "tier.Bronze":              { en: "Bronze",                                   hr: "Bronca" },
  "tier.Silver":              { en: "Silver",                                   hr: "Srebro" },
  "tier.Gold":                { en: "Gold",                                     hr: "Zlato" },
  "tier.Platinum":            { en: "Platinum",                                 hr: "Platina" },

  // ----- Bottom nav -----
  "nav.home":                 { en: "Home",                                     hr: "Početna" },
  "nav.history":              { en: "History",                                  hr: "Povijest" },
  "nav.rewards":              { en: "Rewards",                                  hr: "Nagrade" },
  "nav.profile":              { en: "Profile",                                  hr: "Profil" },
  "nav.notifications":        { en: "Notifications",                            hr: "Obavijesti" },

  // ----- Login / signup -----
  "auth.welcome":             { en: "Welcome back",                             hr: "Dobrodošli natrag" },
  "auth.signInSubtitle":      { en: "Sign in to submit invoices and check your balance.", hr: "Prijavite se za predaju računa i pregled stanja." },
  "auth.email":               { en: "Email",                                    hr: "E-pošta" },
  "auth.password":            { en: "Password",                                 hr: "Lozinka" },
  "auth.signIn":              { en: "Sign in",                                  hr: "Prijava" },
  "auth.signUp":              { en: "Register",                                 hr: "Registracija" },
  "auth.forgot":              { en: "Forgot password?",                         hr: "Zaboravljena lozinka?" },
  "auth.demoOnly":            { en: "Demo only",                                hr: "Samo demo" },
  "auth.demoSubtitle":        { en: "Try the prototype with a sample account",  hr: "Isprobajte prototip s uzorkom računa" },
  "auth.allPasswords":        { en: "All passwords",                            hr: "Sve lozinke" },
  "auth.adminPassword":       { en: "admin",                                    hr: "admin" },
  "auth.installer":           { en: "Installer",                                hr: "Instalater" },
  "auth.adminLabel":          { en: "Admin",                                    hr: "Admin" },
  "auth.adminAccount":        { en: "Viessmann admin",                          hr: "Viessmann admin" },
  "auth.adminDescription":    { en: "Review queue · campaigns · intelligence",  hr: "Pregled · kampanje · analitika" },
  "auth.loginFailed":         { en: "Login failed",                             hr: "Prijava neuspješna" },

  // ----- Dashboard -----
  "dash.welcome":             { en: "Welcome back",                             hr: "Dobrodošli natrag" },
  "dash.negBalance.title":    { en: "Negative balance",                         hr: "Negativno stanje" },
  "dash.negBalance.body":     { en: "Your balance is below zero, usually because Viessmann reversed an earlier accrual. Submit more eligible invoices to clear it. Check the Notifications tab for details.", hr: "Vaše stanje je ispod nule, obično jer je Viessmann poništio raniju uplatu bodova. Predajte više prihvatljivih računa kako biste ga vratili u plus. Više detalja u kartici Obavijesti." },
  "dash.tier":                { en: "tier",                                     hr: "razina" },
  "dash.thisMonth":           { en: "this month",                               hr: "ovog mjeseca" },
  "dash.points":              { en: "points",                                   hr: "bodova" },
  "dash.toNextTier":          { en: "pts to next tier",                         hr: "bodova do sljedeće razine" },
  "dash.topTier":             { en: "Top tier reached",                         hr: "Najviša razina postignuta" },
  "dash.submissions":         { en: "Submissions",                              hr: "Prijave" },
  "dash.approved":            { en: "Approved",                                 hr: "Odobreno" },
  "dash.pending":             { en: "Pending",                                  hr: "Na čekanju" },
  "dash.quickActions":        { en: "Quick actions",                            hr: "Brze radnje" },
  "dash.uploadPdfXml":        { en: "Upload PDF / XML",                         hr: "Učitaj PDF / XML" },
  "dash.fastestPath":         { en: "Fastest path",                             hr: "Najbrži put" },
  "dash.scanCamera":          { en: "Scan with camera",                         hr: "Skeniraj kamerom" },
  "dash.onDeviceOcr":         { en: "On-device OCR · free",                     hr: "OCR na uređaju · besplatno" },
  "dash.recentSubs":          { en: "Recent submissions",                       hr: "Nedavne prijave" },
  "dash.viewAll":             { en: "View all",                                 hr: "Prikaži sve" },
  "dash.empty.title":         { en: "No submissions yet",                       hr: "Još nema prijava" },
  "dash.empty.body":          { en: "Your first submission earns instant points.", hr: "Vaša prva prijava odmah donosi bodove." },
  "dash.empty.cta":           { en: "Submit your first invoice",                hr: "Predajte svoj prvi račun" },
  "dash.unknownWholesaler":   { en: "Unknown wholesaler",                       hr: "Nepoznat veleprodaja" },

  // ----- History -----
  "history.title":            { en: "History",                                  hr: "Povijest" },
  "history.searchPlaceholder":{ en: "Search wholesaler, invoice, OIB…",         hr: "Pretraži veleprodaju, račun, OIB…" },
  "history.tab.all":          { en: "All",                                      hr: "Sve" },
  "history.tab.approved":     { en: "Approved",                                 hr: "Odobreno" },
  "history.tab.review":       { en: "Review",                                   hr: "Pregled" },
  "history.tab.rejected":     { en: "Rejected",                                 hr: "Odbijeno" },
  "history.tab.duplicate":    { en: "Duplicate",                                hr: "Duplikat" },
  "history.empty.title":      { en: "No matching submissions",                  hr: "Nema podudarnih prijava" },
  "history.empty.body":       { en: "Try a different search or filter.",        hr: "Pokušajte s drugom pretragom ili filtrom." },
  "history.invoice":          { en: "Invoice",                                  hr: "Račun" },
  "history.of":               { en: "of",                                       hr: "od" },

  // ----- Submit / receipt detail -----
  "submit.startOver":         { en: "Start over",                               hr: "Počni ispočetka" },
  "submit.choose.subtitle":   { en: "PDF, photo, or e-invoice XML — your call.", hr: "PDF, fotografija ili e-račun XML — vaš izbor." },
  "submit.choose.fileTitle":  { en: "Upload PDF or XML",                        hr: "Učitaj PDF ili XML" },
  "submit.choose.recommended":{ en: "recommended",                              hr: "preporučeno" },
  "submit.choose.fileBody":   { en: "Fastest, ~1 second, free",                 hr: "Najbrže, ~1 sekunda, besplatno" },
  "submit.choose.cameraTitle":{ en: "Scan with camera",                         hr: "Skeniraj kamerom" },
  "submit.choose.cameraBody": { en: "~20 seconds · on-device OCR · free",       hr: "~20 sekundi · OCR na uređaju · besplatno" },
  "submit.choose.tip":        { en: "Tip: photos work best when scanned to PDF first", hr: "Savjet: fotografije najbolje rade kao skenirani PDF" },
  "submit.choose.next":       { en: "What happens next",                        hr: "Što slijedi" },
  "submit.choose.next1":      { en: "We read the invoice — usually 10–20 seconds for a Croatian invoice.", hr: "Pročitat ćemo račun — obično 10–20 sekundi za hrvatski račun." },
  "submit.choose.next2":      { en: "We verify the buyer OIB matches your account.", hr: "Provjerit ćemo da OIB kupca odgovara vašem računu." },
  "submit.choose.next3":      { en: "Only Viessmann lines earn points. Competitor lines stay on the invoice but at 0 pts.", hr: "Samo Viessmann stavke donose bodove. Stavke konkurencije ostaju na računu, ali za 0 bod." },
  "submit.choose.next4":      { en: "If everything checks out, points hit your balance immediately.", hr: "Ako je sve u redu, bodovi se odmah upisuju na vaše stanje." },
  "submit.preview.confirm":   { en: "Confirm & submit",                         hr: "Potvrdi i pošalji" },
  "submit.preview.tip":       { en: "Make sure the invoice is fully visible and not blurry.", hr: "Provjerite je li cijeli račun vidljiv i nije zamućen." },
  "submit.preview.choose":    { en: "Choose different file",                    hr: "Odaberi drugu datoteku" },
  "submit.preview.submit":    { en: "Submit invoice",                           hr: "Pošalji račun" },
  "submit.uploading.steps":   { en: "Processing your invoice",                  hr: "Obrada vašeg računa" },
  "submit.uploading.subtitle":{ en: "This usually takes 10–20 seconds.",        hr: "Obično traje 10–20 sekundi." },
  "submit.steps.uploading":   { en: "Uploading the file",                       hr: "Učitavanje datoteke" },
  "submit.steps.reading":     { en: "Reading the invoice",                      hr: "Čitanje računa" },
  "submit.steps.oib":         { en: "Validating OIB",                           hr: "Provjera OIB-a" },
  "submit.steps.matching":    { en: "Matching Viessmann products",              hr: "Povezivanje Viessmann proizvoda" },
  "submit.steps.points":      { en: "Calculating points",                       hr: "Izračun bodova" },
  "submit.ocr.statusPrepare": { en: "Preparing OCR",                            hr: "Priprema OCR-a" },
  "submit.ocr.body2":         { en: "Reading the invoice on your device. First photo can take ~30s while the language model loads — subsequent ones are faster.", hr: "Čitanje računa na vašem uređaju. Prva fotografija može trajati ~30s dok se učita jezični model — sljedeće su brže." },
  "submit.result.titleApproved":{ en: "Approved!",                              hr: "Odobreno!" },
  "submit.result.titleReview":{ en: "Pending review",                           hr: "Na pregledu" },
  "submit.result.titleRejected":{ en: "Rejected",                               hr: "Odbijeno" },
  "submit.result.titleDuplicate":{ en: "Already submitted",                     hr: "Već predano" },
  "submit.result.whatWeRead": { en: "What we read",                             hr: "Što smo pročitali" },
  "submit.result.seller":     { en: "Seller",                                   hr: "Prodavatelj" },
  "submit.result.buyer":      { en: "Buyer",                                    hr: "Kupac" },
  "submit.result.invoiceNum": { en: "Invoice #",                                hr: "Broj računa" },
  "submit.result.date":       { en: "Date",                                     hr: "Datum" },
  "submit.result.lines":      { en: "Lines",                                    hr: "Stavke" },
  "submit.result.total":      { en: "Total",                                    hr: "Ukupno" },
  "submit.result.openOriginal":{ en: "Open original submission",                hr: "Otvori originalnu prijavu" },
  "submit.result.viewThis":   { en: "View this attempt",                        hr: "Prikaži ovaj pokušaj" },
  "submit.result.viewDetail": { en: "View detail",                              hr: "Prikaži detalje" },
  "submit.result.another":    { en: "Submit another",                           hr: "Predaj još jedan" },
  "submit.result.notes":      { en: "Notes",                                    hr: "Napomene" },
  "submit.title":             { en: "Submit invoice",                           hr: "Predaj račun" },
  "submit.choose.title":      { en: "How would you like to submit?",            hr: "Kako želite predati?" },
  "submit.choose.upload":     { en: "Upload PDF or e-invoice XML",              hr: "Učitaj PDF ili e-račun XML" },
  "submit.choose.uploadDesc": { en: "Fastest. Works offline-first.",            hr: "Najbrže. Radi i bez interneta." },
  "submit.choose.camera":     { en: "Scan invoice with camera",                 hr: "Skeniraj račun kamerom" },
  "submit.choose.cameraDesc": { en: "On-device OCR (Croatian + English). Free.", hr: "OCR na uređaju (hrvatski + engleski). Besplatno." },
  "submit.preview.title":     { en: "Preview",                                  hr: "Pregled" },
  "submit.preview.send":      { en: "Send for review",                          hr: "Pošalji na pregled" },
  "submit.preview.different": { en: "Choose a different file",                  hr: "Odaberi drugu datoteku" },
  "submit.uploading.title":   { en: "Processing your invoice…",                 hr: "Obrada vašeg računa…" },
  "submit.uploading.body":    { en: "Parsing fields, matching products, awarding points.", hr: "Čitanje polja, povezivanje proizvoda, dodjela bodova." },
  "submit.ocr.title":         { en: "Reading your photo…",                      hr: "Čitanje vaše fotografije…" },
  "submit.ocr.body":          { en: "Running on-device OCR (Croatian + English). This is private — nothing leaves your phone.", hr: "Pokrećem OCR na uređaju (hrvatski + engleski). Privatno — ništa ne napušta vaš mobitel." },
  "submit.result.approved":   { en: "Approved!",                                hr: "Odobreno!" },
  "submit.result.review":     { en: "Pending review",                           hr: "Na pregledu" },
  "submit.result.rejected":   { en: "Rejected",                                 hr: "Odbijeno" },
  "submit.result.duplicate":  { en: "Already submitted",                        hr: "Već predano" },
  "submit.result.viewDetails":{ en: "View details",                             hr: "Prikaži detalje" },
  "submit.result.submitAnother":{ en: "Submit another",                         hr: "Predaj još jedan" },
  "submit.imageHelp.title":   { en: "Photo doesn't look like an invoice",       hr: "Fotografija ne izgleda kao račun" },
  "submit.imageHelp.body":    { en: "Try a clearer, well-lit shot of the full invoice page.", hr: "Pokušajte s jasnijom, dobro osvijetljenom fotografijom cijele stranice računa." },

  // ----- Receipt detail -----
  "receipt.backHistory":      { en: "Back to history",                          hr: "Natrag na povijest" },
  "receipt.invoice":          { en: "Invoice",                                  hr: "Račun" },
  "receipt.seller":           { en: "Seller (wholesaler)",                      hr: "Prodavatelj (veleprodaja)" },
  "receipt.buyer":            { en: "Buyer (you)",                              hr: "Kupac (vi)" },
  "receipt.pointsCredited":   { en: "Points credited",                          hr: "Dodijeljeni bodovi" },
  "receipt.lineItems":        { en: "Line items",                               hr: "Stavke" },
  "receipt.subtotal":         { en: "Subtotal",                                 hr: "Iznos" },
  "receipt.vat":              { en: "VAT",                                      hr: "PDV" },
  "receipt.total":            { en: "Total",                                    hr: "Ukupno" },
  "receipt.timeline":         { en: "Status timeline",                          hr: "Vremenska linija statusa" },
  "receipt.note":             { en: "Note from Viessmann",                      hr: "Napomena Viessmanna" },
  "receipt.systemNotes":      { en: "System notes",                             hr: "Sistemske napomene" },
  "receipt.viewOriginal":     { en: "View original file",                       hr: "Prikaži originalnu datoteku" },
  "receipt.submitDifferent":  { en: "Submit a different invoice",               hr: "Predaj drugi račun" },
  "receipt.submitCorrected":  { en: "Submit a corrected version",               hr: "Predaj ispravljenu verziju" },
  "receipt.timeline.submitted":{ en: "Submitted",                               hr: "Predano" },
  "receipt.timeline.parsed":  { en: "Parsed & matched",                         hr: "Pročitano i uparenoo" },
  "receipt.timeline.approved":{ en: "Approved",                                 hr: "Odobreno" },
  "receipt.timeline.rejected":{ en: "Rejected",                                 hr: "Odbijeno" },
  "receipt.timeline.duplicate":{ en: "Duplicate detected",                      hr: "Otkriven duplikat" },
  "receipt.timeline.pending": { en: "Pending review",                           hr: "Na pregledu" },
  "receipt.timeline.credited":{ en: "Points credited to ledger",                hr: "Bodovi pripisani u knjigu" },
  "receipt.viessmann":        { en: "Viessmann",                                hr: "Viessmann" },
  "receipt.unmatched":        { en: "unmatched",                                hr: "neusklađeno" },
  "receipt.other":            { en: "other / 0 pts",                            hr: "drugo / 0 bod." },
  "receipt.bonus":            { en: "bonus",                                    hr: "bonus" },

  // ----- Rewards -----
  "rewards.title":            { en: "Rewards",                                  hr: "Nagrade" },
  "rewards.balance":          { en: "Balance:",                                 hr: "Stanje:" },
  "rewards.empty.title":      { en: "No rewards available",                     hr: "Nema dostupnih nagrada" },
  "rewards.empty.body":       { en: "Check back soon.",                         hr: "Provjerite uskoro." },
  "rewards.outOfStock":       { en: "Out of stock",                             hr: "Nije na zalihi" },
  "rewards.onlyLeft":         { en: "Only {n} left",                            hr: "Još samo {n} kom" },
  "rewards.reachToUnlock":    { en: "Reach {tier} to unlock",                   hr: "Dosegnite razinu {tier} za otključavanje" },
  "rewards.btn.redeem":       { en: "Redeem",                                   hr: "Iskoristi" },
  "rewards.btn.redeemed":     { en: "Redeemed",                                 hr: "Iskorišteno" },
  "rewards.btn.locked":       { en: "Locked — reach {tier}",                    hr: "Zaključano — dosegnite {tier}" },
  "rewards.btn.needMore":     { en: "Need {n} more pts",                        hr: "Trebate još {n} bod." },
  "rewards.btn.outOfStock":   { en: "Out of stock",                             hr: "Nije na zalihi" },
  "rewards.confirm.title":    { en: "Redeem {name}?",                           hr: "Iskoristiti {name}?" },
  "rewards.confirm.body1":    { en: "{cost} pts will be deducted from your balance.", hr: "{cost} bod. bit će oduzeto sa stanja." },
  "rewards.confirm.body2":    { en: "You'll be left with {remaining} pts. Viessmann ships within 5 business days.", hr: "Ostat će vam {remaining} bod. Viessmann otprema unutar 5 radnih dana." },
  "rewards.toast.success":    { en: "Redeemed: {name}",                         hr: "Iskorišteno: {name}" },
  "rewards.toast.failed":     { en: "Redemption failed",                        hr: "Iskorištenje nije uspjelo" },

  // ----- Profile -----
  "profile.title":            { en: "Profile",                                  hr: "Profil" },
  "profile.tier":             { en: "tier",                                     hr: "razina" },
  "profile.memberSince":      { en: "Member since",                             hr: "Član od" },
  "profile.currentBalance":   { en: "Current balance",                          hr: "Trenutno stanje" },
  "profile.lifetimeEarned":   { en: "Lifetime earned",                          hr: "Ukupno zarađeno" },
  "profile.businessDetails":  { en: "Business details",                         hr: "Poslovni podaci" },
  "profile.address":          { en: "Address",                                  hr: "Adresa" },
  "profile.city":             { en: "City",                                     hr: "Grad" },
  "profile.postalCode":       { en: "Postal code",                              hr: "Poštanski broj" },
  "profile.email":            { en: "Email",                                    hr: "E-pošta" },
  "profile.phone":            { en: "Phone",                                    hr: "Telefon" },
  "profile.joined":           { en: "Joined",                                   hr: "Pridružen" },
  "profile.companyName":      { en: "Company name",                             hr: "Naziv tvrtke" },
  "profile.editProfile":      { en: "Edit profile",                             hr: "Uredi profil" },
  "profile.myRedemptions":    { en: "My redemptions",                           hr: "Moja iskorištenja" },
  "profile.noRedemptions":    { en: "No redemptions yet.",                      hr: "Još nema iskorištenja." },
  "profile.recentActivity":   { en: "Recent points activity",                   hr: "Nedavna aktivnost bodova" },
  "profile.noActivity":       { en: "No activity yet.",                         hr: "Još nema aktivnosti." },
  "profile.ledger.accrual":   { en: "accrual",                                  hr: "uplata" },
  "profile.ledger.redemption":{ en: "redemption",                               hr: "iskorištenje" },
  "profile.ledger.reversal":  { en: "reversal",                                 hr: "poništenje" },
  "profile.ledger.adjustment":{ en: "adjustment",                               hr: "korekcija" },

  // ----- Notifications -----
  "notif.title":              { en: "Notifications",                            hr: "Obavijesti" },
  "notif.empty.title":        { en: "All quiet here",                           hr: "Ovdje je tiho" },
  "notif.empty.body":         { en: "Submit your first invoice to see updates.",hr: "Predajte svoj prvi račun za ažuriranja." },
  "notif.approved":           { en: "Approved: {n}",                            hr: "Odobreno: {n}" },
  "notif.approved.body":      { en: "+{pts} pts credited from {who}.",          hr: "+{pts} bod. od {who}." },
  "notif.pending":            { en: "Pending review: {n}",                      hr: "Na pregledu: {n}" },
  "notif.pending.body":       { en: "We'll get back to you within 24 hours.",   hr: "Javit ćemo vam se unutar 24 sata." },
  "notif.rejected":            { en: "Rejected: {n}",                           hr: "Odbijeno: {n}" },
  "notif.duplicate":           { en: "Duplicate: {n}",                          hr: "Duplikat: {n}" },
  "notif.rejected.fallback":  { en: "Could not award points.",                  hr: "Nije bilo moguće dodijeliti bodove." },
  "notif.duplicate.fallback": { en: "Already submitted previously.",            hr: "Već je ranije predano." },
  "notif.redeemed":           { en: "Redeemed: {name}",                         hr: "Iskorišteno: {name}" },
  "notif.redeemed.body":      { en: "−{cost} pts. Status: {status}.",           hr: "−{cost} bod. Status: {status}." },
  "notif.reversal":           { en: "Points reversed by Viessmann",             hr: "Viessmann je poništio bodove" },
  "notif.adjustment":         { en: "Points adjusted by Viessmann",             hr: "Viessmann je korigirao bodove" },
  "notif.tierUp":             { en: "Welcome to {tier}!",                       hr: "Dobrodošli u razinu {tier}!" },
  "notif.tierUp.body":        { en: "You moved up from {from} — enjoy the new rewards.", hr: "Prešli ste s razine {from} — uživajte u novim nagradama." },

  // ----- Settings -----
  "settings.title":           { en: "Settings",                                 hr: "Postavke" },
  "settings.language":        { en: "Language",                                 hr: "Jezik" },
  "settings.languageBody":    { en: "Choose the language for the app interface.", hr: "Odaberite jezik sučelja aplikacije." },
  "settings.langEn":          { en: "English",                                  hr: "Engleski" },
  "settings.langHr":          { en: "Hrvatski",                                 hr: "Hrvatski" },
  "settings.notifications":   { en: "Notifications",                            hr: "Obavijesti" },
  "settings.notifBody":       { en: "Push notifications for receipt approvals, tier changes, and reward stock are part of the production app. The web prototype shows them in the Notifications tab.", hr: "Push obavijesti za odobrenja računa, promjene razine i dostupnost nagrada dio su produkcijske aplikacije. Web prototip ih prikazuje u kartici Obavijesti." },
  "settings.installApp":      { en: "Install as app",                           hr: "Instaliraj kao aplikaciju" },
  "settings.installBody":     { en: "On iOS Safari: tap the share icon → Add to Home Screen. On Android Chrome: menu → Install app.", hr: "iOS Safari: dodirnite ikonu dijeljenja → Dodaj na početni zaslon. Android Chrome: izbornik → Instaliraj aplikaciju." },
  "settings.privacy":         { en: "Privacy",                                  hr: "Privatnost" },
  "settings.privacyBody":     { en: "Your data is hosted in the EU and processed under our GDPR DPIA. To request data export or erasure, email", hr: "Vaši podaci pohranjeni su u EU i obrađuju se po našoj GDPR DPIA. Za zahtjev izvoza ili brisanja podataka, pošaljite e-poštu na" },
  "settings.password.title":  { en: "Change password",                          hr: "Promijeni lozinku" },
  "settings.password.current":{ en: "Current password",                         hr: "Trenutna lozinka" },
  "settings.password.new":    { en: "New password",                             hr: "Nova lozinka" },
  "settings.password.btn":    { en: "Update password",                          hr: "Ažuriraj lozinku" },
};

/**
 * Look up a translation. If the locale doesn't have the entry, falls back to
 * English. If the key doesn't exist at all, returns the key itself (so the
 * developer notices in QA). Supports {placeholder} interpolation.
 */
export function tr(key: string, locale: Locale, vars?: Record<string, string | number>): string {
  const entry = dict[key];
  let raw: string;
  if (!entry) raw = key;
  else raw = entry[locale] ?? entry.en ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

export const SUPPORTED: Locale[] = ["en", "hr"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";
