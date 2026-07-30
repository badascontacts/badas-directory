// ================================================================
// BADAS DIRECTORY - Sample & Fallback Data
// ================================================================

// ── Organizations (15 Sister Concerns) ──────────────────────────
const SAMPLE_ORGS = [
  { org_id:'BADAS',  org_name:'BADAS',    org_full_name:'Diabetic Association of Bangladesh',                                                            logo_url:'', address:'122 Kazi Nazrul Islam Ave, Dhaka-1000',  phone:'+880-2-9669551',  email:'info@badas.org.bd',        website:'https://www.badas.bd',       about:'BADAS (Diabetic Association of Bangladesh) is the pioneering organization in Bangladesh dedicated to the prevention and management of diabetes since 1956.', color:'#1565C0' },
  { org_id:'BIRDEM', org_name:'BIRDEM',   org_full_name:'Bangladesh Institute of Research & Rehabilitation in Diabetes, Endocrine and Metabolic Disorders', logo_url:'', address:'Shahbagh, Dhaka-1000',                 phone:'+880-2-9669974',  email:'info@birdem-gh.com',       website:'https://www.birdembd.org',   about:'BIRDEM General Hospital is a specialized referral hospital under BADAS providing tertiary level healthcare.', color:'#00796B' },
  { org_id:'IMC',    org_name:'IMC',      org_full_name:'Ibrahim Medical College',                                                                         logo_url:'', address:'Shahbagh, Dhaka-1000',                 phone:'+880-2-9663951',  email:'info@imc.edu.bd',          website:'https://imc.edu.bd',         about:'Ibrahim Medical College (IMC) is a BADAS affiliated medical college offering MBBS and postgraduate degrees.', color:'#6A1B9A' },
  { org_id:'BIHS',   org_name:'BIHS',     org_full_name:'Bangladesh Institute of Health Sciences',                                                          logo_url:'', address:'Mirpur-1, Dhaka-1216',                 phone:'+880-2-8016401',  email:'info@bihs.edu.bd',         website:'https://bihs.edu.bd',        about:'BIHS is a health sciences university under BADAS providing undergraduate and postgraduate programs in allied health.', color:'#C62828' },
  { org_id:'NCDC',   org_name:'NCDC',     org_full_name:'National Centre for Control of Rheumatic Fever and Heart Disease',                                logo_url:'', address:'Tejgaon, Dhaka-1208',                 phone:'+880-2-8119000',  email:'info@ncdc-badas.org',      website:'',                           about:'NCDC provides specialized cardiac and diabetes care services under the BADAS umbrella.', color:'#E65100' },
  { org_id:'BARD',   org_name:'BARD',     org_full_name:'BADAS Research & Development',                                                                    logo_url:'', address:'122 Kazi Nazrul Islam Ave, Dhaka',    phone:'+880-2-9669552',  email:'research@bard.org.bd',     website:'',                           about:'BARD focuses on diabetes-related research and development activities under BADAS.', color:'#1565C0' },
  { org_id:'CTG',    org_name:'BADAS Ctg',org_full_name:'BADAS Chittagong',                                                                                 logo_url:'', address:'Chittagong',                          phone:'+880-31-620177',  email:'director@badas-ctg.org',   website:'',                           about:'BADAS Chittagong is the Chittagong division branch of the Diabetic Association of Bangladesh.', color:'#1565C0' },
  { org_id:'SYL',    org_name:'BADAS Syl',org_full_name:'BADAS Sylhet',                                                                                     logo_url:'', address:'Sylhet',                              phone:'+880-821-714600', email:'director@badas-syl.org',   website:'',                           about:'BADAS Sylhet serves the Sylhet division under BADAS.', color:'#1565C0' },
  { org_id:'RJH',    org_name:'BADAS Raj',org_full_name:'BADAS Rajshahi',                                                                                   logo_url:'', address:'Rajshahi',                            phone:'+880-721-810200', email:'director@badas-raj.org',   website:'',                           about:'BADAS Rajshahi serves the Rajshahi division under BADAS.', color:'#1565C0' },
  { org_id:'KHL',    org_name:'BADAS Khl',org_full_name:'BADAS Khulna',                                                                                     logo_url:'', address:'Khulna',                              phone:'+880-41-720300',  email:'director@badas-khl.org',   website:'',                           about:'BADAS Khulna serves the Khulna division under BADAS.', color:'#1565C0' },
  { org_id:'PHMC',   org_name:'Popular',  org_full_name:'Popular Medical College & Hospital',                                                               logo_url:'', address:'House 16, Road 2, Dhanmondi, Dhaka',  phone:'+880-2-9128001',  email:'info@popularmc.org',       website:'',                           about:'Popular Medical College & Hospital is a sister concern under BADAS providing comprehensive healthcare.', color:'#0277BD' },
  { org_id:'DNC',    org_name:'BADAS Nsg',org_full_name:'BADAS Nursing College',                                                                            logo_url:'', address:'Shahbagh, Dhaka',                     phone:'+880-2-9670100',  email:'principal@badasnursing.edu.bd',website:'',                        about:'BADAS Nursing College trains nursing professionals for Bangladesh health sector.', color:'#00838F' },
  { org_id:'BPL',    org_name:'BADAS Phm',org_full_name:'BADAS Pharmacy Ltd',                                                                              logo_url:'', address:'Dhaka',                               phone:'+880-2-9662001',  email:'info@badaspharmacy.com',   website:'',                           about:'BADAS Pharmacy Ltd provides affordable medicines and pharmaceutical services.', color:'#2E7D32' },
  { org_id:'BEYE',   org_name:'BADAS Eye',org_full_name:'BADAS Eye Hospital',                                                                               logo_url:'', address:'Mirpur, Dhaka',                       phone:'+880-2-9120065',  email:'info@badaseye.org',        website:'',                           about:'BADAS Eye Hospital provides specialized ophthalmology services.', color:'#4527A0' },
  { org_id:'BFN',    org_name:'BADAS Fdn',org_full_name:'BADAS Foundation',                                                                                 logo_url:'', address:'122 Kazi Nazrul Islam Ave, Dhaka-1000',phone:'+880-2-9669554',  email:'foundation@badas.org.bd',  website:'',                           about:'BADAS Foundation supports social welfare activities, scholarships, and community health programs.', color:'#1565C0' },
];

// ── Contacts ─────────────────────────────────────────────────────
// Google Sheet column order:
//   contact_id | org_id | name | designation | department | phone | email | photo_url | has_whatsapp | ext
// ext = telephone extension number on the org's main landline (optional, leave blank if none)
const SAMPLE_CONTACTS = [
  { contact_id:'C001', org_id:'BADAS',  name:'Prof. Dr. A.K. Azad Khan',      designation:'President',               department:'Executive Committee', phone:'+8801711000001', email:'president@badas.org.bd',        photo_url:'', has_whatsapp:'TRUE',  ext:'101' },
  { contact_id:'C002', org_id:'BADAS',  name:'Dr. Md. Feroz Amin',            designation:'Secretary General',       department:'Executive Committee', phone:'+8801711000002', email:'sg@badas.org.bd',               photo_url:'', has_whatsapp:'TRUE',  ext:'102' },
  { contact_id:'C003', org_id:'BADAS',  name:'Nasrin Sultana',                designation:'Director, Finance',       department:'Finance',             phone:'+8801711000003', email:'finance@badas.org.bd',          photo_url:'', has_whatsapp:'FALSE', ext:'103' },
  { contact_id:'C004', org_id:'BADAS',  name:'Md. Rafiqul Islam',             designation:'IT Manager',              department:'IT',                  phone:'+8801711000004', email:'it@badas.org.bd',               photo_url:'', has_whatsapp:'TRUE',  ext:'104' },
  { contact_id:'C005', org_id:'BIRDEM', name:'Prof. Dr. Hajera Mahtab',       designation:'Director General',        department:'Administration',      phone:'+8801711000005', email:'dg@birdem-gh.com',              photo_url:'', has_whatsapp:'TRUE',  ext:'201' },
  { contact_id:'C006', org_id:'BIRDEM', name:'Dr. Tofail Ahmed',              designation:'Head of Endocrinology',   department:'Endocrinology',       phone:'+8801711000006', email:'endocrine@birdem-gh.com',       photo_url:'', has_whatsapp:'TRUE',  ext:'215' },
  { contact_id:'C007', org_id:'BIRDEM', name:'Dr. Shamima Akter',             designation:'Chief Medical Officer',   department:'Medical',             phone:'+8801711000007', email:'cmo@birdem-gh.com',             photo_url:'', has_whatsapp:'FALSE', ext:'202' },
  { contact_id:'C008', org_id:'BIRDEM', name:'Mohammad Hossain',              designation:'Head of HR',              department:'Human Resources',     phone:'+8801711000008', email:'hr@birdem-gh.com',              photo_url:'', has_whatsapp:'TRUE',  ext:'220' },
  { contact_id:'C009', org_id:'IMC',    name:'Prof. Dr. Mohsin Ali',          designation:'Principal',               department:'Administration',      phone:'+8801711000009', email:'principal@imc.edu.bd',          photo_url:'', has_whatsapp:'TRUE',  ext:'301' },
  { contact_id:'C010', org_id:'IMC',    name:'Dr. Farida Khanam',             designation:'Vice Principal',          department:'Administration',      phone:'+8801711000010', email:'vp@imc.edu.bd',                 photo_url:'', has_whatsapp:'FALSE', ext:'302' },
  { contact_id:'C011', org_id:'IMC',    name:'Prof. Dr. Mahbub Muttalib',     designation:'Head of Medicine',        department:'Medicine',            phone:'+8801711000011', email:'medicine@imc.edu.bd',           photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C012', org_id:'BIHS',   name:'Prof. Dr. Liaquat Ali',         designation:'Vice Chancellor',         department:'Administration',      phone:'+8801711000012', email:'vc@bihs.edu.bd',                photo_url:'', has_whatsapp:'TRUE',  ext:'401' },
  { contact_id:'C013', org_id:'BIHS',   name:'Dr. Zarina Mehzabin',           designation:'Registrar',               department:'Administration',      phone:'+8801711000013', email:'registrar@bihs.edu.bd',         photo_url:'', has_whatsapp:'TRUE',  ext:'402' },
  { contact_id:'C014', org_id:'BIHS',   name:'Md. Shafiqul Islam',            designation:'Dean, Public Health',     department:'Public Health',       phone:'+8801711000014', email:'publichealth@bihs.edu.bd',      photo_url:'', has_whatsapp:'FALSE', ext:''    },
  { contact_id:'C015', org_id:'NCDC',   name:'Dr. Mustafa Zaman',             designation:'Executive Director',      department:'Administration',      phone:'+8801711000015', email:'ed@ncdc-badas.org',             photo_url:'', has_whatsapp:'TRUE',  ext:'501' },
  { contact_id:'C016', org_id:'NCDC',   name:'Dr. Rabina Begum',              designation:'Head of Cardiology',      department:'Cardiology',          phone:'+8801711000016', email:'cardio@ncdc-badas.org',         photo_url:'', has_whatsapp:'TRUE',  ext:'510' },
  { contact_id:'C017', org_id:'NCDC',   name:'Dr. Kamrul Hasan',              designation:'Head of Diabetes',        department:'Diabetology',         phone:'+8801711000017', email:'diabetes@ncdc-badas.org',       photo_url:'', has_whatsapp:'FALSE', ext:'511' },
  { contact_id:'C018', org_id:'BARD',   name:'Prof. Dr. Sanjay Bhattacharya', designation:'Research Director',       department:'Research',            phone:'+8801711000018', email:'research@bard.org.bd',          photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C019', org_id:'BARD',   name:'Dr. Ananya Roy',                designation:'Senior Researcher',       department:'Research',            phone:'+8801711000019', email:'aroy@bard.org.bd',              photo_url:'', has_whatsapp:'FALSE', ext:''    },
  { contact_id:'C020', org_id:'CTG',    name:'Dr. Rejaul Karim',              designation:'Director',                department:'Administration',      phone:'+8801711000020', email:'director@badas-ctg.org',        photo_url:'', has_whatsapp:'TRUE',  ext:'601' },
  { contact_id:'C021', org_id:'CTG',    name:'Dr. Nasrin Islam',              designation:'Medical Officer',         department:'Medical',             phone:'+8801711000021', email:'medical@badas-ctg.org',         photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C022', org_id:'SYL',    name:'Dr. Shahab Uddin',              designation:'Director',                department:'Administration',      phone:'+8801711000022', email:'director@badas-syl.org',        photo_url:'', has_whatsapp:'FALSE', ext:'701' },
  { contact_id:'C023', org_id:'SYL',    name:'Rahela Khatun',                 designation:'Admin Officer',           department:'Administration',      phone:'+8801711000023', email:'admin@badas-syl.org',           photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C024', org_id:'RJH',    name:'Dr. Abdur Rahman',              designation:'Director',                department:'Administration',      phone:'+8801711000024', email:'director@badas-raj.org',        photo_url:'', has_whatsapp:'TRUE',  ext:'801' },
  { contact_id:'C025', org_id:'RJH',    name:'Dr. Farha Deba',                designation:'Medical Officer',         department:'Medical',             phone:'+8801711000025', email:'medical@badas-raj.org',         photo_url:'', has_whatsapp:'FALSE', ext:''    },
  { contact_id:'C026', org_id:'KHL',    name:'Dr. Siddiqur Rahman',           designation:'Director',                department:'Administration',      phone:'+8801711000026', email:'director@badas-khl.org',        photo_url:'', has_whatsapp:'TRUE',  ext:'901' },
  { contact_id:'C027', org_id:'KHL',    name:'Mahbuba Akter',                 designation:'Finance Officer',         department:'Finance',             phone:'+8801711000027', email:'finance@badas-khl.org',         photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C028', org_id:'PHMC',   name:'Dr. Faruk Ahmed',               designation:'Chief Executive',         department:'Administration',      phone:'+8801711000028', email:'ce@popularmc.org',              photo_url:'', has_whatsapp:'TRUE',  ext:'1001'},
  { contact_id:'C029', org_id:'PHMC',   name:'Dr. Sumaya Islam',              designation:'Medical Director',        department:'Medical',             phone:'+8801711000029', email:'md@popularmc.org',              photo_url:'', has_whatsapp:'FALSE', ext:'1010'},
  { contact_id:'C030', org_id:'PHMC',   name:'Rashed Karim',                  designation:'Head of Operations',      department:'Operations',          phone:'+8801711000030', email:'ops@popularmc.org',             photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C031', org_id:'DNC',    name:'Ms. Shirin Akter',              designation:'Principal',               department:'Administration',      phone:'+8801711000031', email:'principal@badasnursing.edu.bd', photo_url:'', has_whatsapp:'FALSE', ext:'1101'},
  { contact_id:'C032', org_id:'DNC',    name:'Ms. Roksana Begum',             designation:'Head of Clinical Studies', department:'Clinical',           phone:'+8801711000032', email:'clinical@badasnursing.edu.bd',  photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C033', org_id:'BPL',    name:'Mohammad Kamal',                designation:'Manager',                 department:'Operations',          phone:'+8801711000033', email:'manager@badaspharmacy.com',     photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C034', org_id:'BPL',    name:'Shanta Das',                    designation:'Pharmacist-in-Charge',    department:'Pharmacy',            phone:'+8801711000034', email:'pharmacist@badaspharmacy.com',  photo_url:'', has_whatsapp:'FALSE', ext:''    },
  { contact_id:'C035', org_id:'BEYE',   name:'Dr. Omar Farouq',               designation:'Medical Director',        department:'Medical',             phone:'+8801711000035', email:'director@badaseye.org',         photo_url:'', has_whatsapp:'TRUE',  ext:'1301'},
  { contact_id:'C036', org_id:'BEYE',   name:'Dr. Meherun Nessa',             designation:'Senior Ophthalmologist',  department:'Ophthalmology',       phone:'+8801711000036', email:'eye@badaseye.org',              photo_url:'', has_whatsapp:'TRUE',  ext:''    },
  { contact_id:'C037', org_id:'BFN',    name:'Mr. Nurul Islam',               designation:'Executive Director',      department:'Administration',      phone:'+8801711000037', email:'ed@badasfoundation.org',        photo_url:'', has_whatsapp:'FALSE', ext:'1401'},
  { contact_id:'C038', org_id:'BFN',    name:'Ms. Dilruba Khan',              designation:'Program Officer',         department:'Programs',            phone:'+8801711000038', email:'programs@badasfoundation.org',  photo_url:'', has_whatsapp:'TRUE',  ext:''    },
];

// ── Emergency Contacts ───────────────────────────────────────────
// Google Sheet column order: contact_id | name | designation | org_id | phone | type | is_active
const SAMPLE_EMERGENCY = [
  { contact_id:'E001', name:'BIRDEM Emergency',        designation:'Emergency Department', org_id:'BIRDEM', phone:'+880-2-9669974',  type:'Hospital',   is_active:'TRUE' },
  { contact_id:'E002', name:'NCDC Emergency',          designation:'Emergency Ward',       org_id:'NCDC',   phone:'+880-2-8119000',  type:'Hospital',   is_active:'TRUE' },
  { contact_id:'E003', name:'BADAS Eye Emergency',     designation:'Eye Emergency',        org_id:'BEYE',   phone:'+880-2-9120065',  type:'Hospital',   is_active:'TRUE' },
  { contact_id:'E004', name:'BADAS HQ Emergency',      designation:'Reception',            org_id:'BADAS',  phone:'+880-2-9667551',  type:'Admin',      is_active:'TRUE' },
  { contact_id:'E005', name:'BIRDEM Ambulance',        designation:'Ambulance Service',    org_id:'BIRDEM', phone:'+880-2-9669001',  type:'Ambulance',  is_active:'TRUE' },
];

// ── National Emergency Numbers (hardcoded, always available) ────
const NATIONAL_EMERGENCY = [
  { label:'Police',           number:'999',   icon:'🚔', color:'#3B82F6' },
  { label:'Ambulance',        number:'199',   icon:'🚑', color:'#EF4444' },
  { label:'Fire Service',     number:'199',   icon:'🚒', color:'#F97316' },
  { label:'National Hotline', number:'16969', icon:'☎️', color:'#8B5CF6' },
  { label:'Poison Control',   number:'01779-085965', icon:'⚕️', color:'#059669' },
  { label:'COVID Helpline',   number:'16741', icon:'🏥', color:'#0891B2' },
];

// ── Banner Ad ────────────────────────────────────────────────────
// Google Sheet column order: image_url | click_url | is_active
// Set is_active to FALSE or leave empty to hide banner
const SAMPLE_BANNER = {
  image_url:  '',      // URL of banner image (leave empty = no banner)
  click_url:  '#',     // URL to open when banner is tapped
  is_active:  'FALSE', // TRUE or FALSE
};

// ── App Settings (from 'Settings' tab in Google Sheet) ──────────
// Sheet column order:  key | value
// Example rows in your sheet:
//   key        | value
//   password   | BADAS@2024
const SAMPLE_SETTINGS = {
  password: 'BADAS@2024',   // Change in YOUR Google Sheet — no need to edit code!
  hint:     'Contact the BADAS IT department for access.',  // Shown after wrong password
};

// ── CSV Parser ───────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every(v => v.trim() === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (values[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else { cur += ch; }
  }
  result.push(cur);
  return result;
}
