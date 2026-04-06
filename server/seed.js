const mongoose = require('mongoose');
require('dotenv').config();
const Customer = require('./models/Customer');

const buyers = [
  { name: "Panchasheel Medical",               address: "",              city: "Chh.Sambhajinagar", gst: "27AAATD19998G1ZJ" },
  { name: "Rushikesh Medical",                  address: "",              city: "Chh.Sambhajinagar", gst: "27ABEPH7135C1Z0"  },
  { name: "Shivsai Medical",                    address: "",              city: "Chh.Sambhajinagar", gst: "27ADIFS5838F1ZQ"  },
  { name: "Sevenstar Hospital",                 address: "",              city: "Nagpur",             gst: "27AAECN5090N1ZY" },
  { name: "Andhra Hospital",                    address: "Eluru",         city: "A. P.",              gst: "37AAKCA2196A1ZU" },
  { name: "Bafna Surgicals",                    address: "",              city: "Thane",              gst: "27AAJFB1415F1ZV" },
  { name: "G. I. Pharma",                       address: "",              city: "Ahmedabad",          gst: "24AAPFG4330C1ZS" },
  { name: "Gem Hospital Coimbatore",            address: "",              city: "Tamilnadu",          gst: "33AABCG8302P2ZH" },
  { name: "Niscco Agency",                      address: "",              city: "Chh.Sambhajinagar", gst: "27AFTPA2739N1ZX" },
  { name: "Surya Hospital Pharmacy",            address: "",              city: "Pune",               gst: "27AACCS9236M1ZT" },
  { name: "V R Medicare Pvt. Ltd",             address: "",              city: "",                   gst: ""                },
  { name: "Zen Hospital",                       address: "",              city: "Chembur",            gst: "27AAECV2145E1ZJ" },
  { name: "Jyoti Nursing Home",                 address: "",              city: "Jaipur",             gst: "08AAGHJ2526N1Z2" },
  { name: "Bajaj Hospital",                     address: "",              city: "Chh.Sambhajinagar", gst: "27AAATM6631K1ZD" },
  { name: "Psi Mkt. Pvt. Ltd.",                 address: "",              city: "Nagpur",             gst: "27AABCP1344E1ZT" },
  { name: "Kaizen Pharmacy",                    address: "",              city: "Ahmedabad",          gst: "24AADCG4824E2ZY" },
  { name: "Thaimedical",                        address: "Ballagundu",    city: "Tamilnadu",          gst: "33AWVPR8115N1ZO" },
  { name: "Jehangir Hospital",                  address: "",              city: "Pune",               gst: ""                },
  { name: "Shivneri Swast Aushadhi",            address: "",              city: "",                   gst: "27ADUFS3097AIZP" },
  { name: "Jeevan Amrut Haematology Centre",   address: "",              city: "Chh.Sambhajinagar", gst: "27AOFPT2485K1ZC" },
  { name: "Mit Hospital And Research Institute",address: "",              city: "Chh.Sambhajinagar", gst: "27AAATG2943C1Z1" },
  { name: "Sakthiwood Industries",              address: "Mettupalayam",  city: "Tamilnadu",          gst: "33APGPK4730A1Z1" },
  { name: "Madhan Exports",                     address: "Erode",         city: "Tamilnadu",          gst: "33AIMPM6721E1ZD" },
  { name: "Ess Bee Surgicals",                  address: "",              city: "Chandigarh",         gst: "04AAHFE3708L1ZH" },
  { name: "Bajaj Life Care",                    address: "",              city: "",                   gst: "27ABAPB1221D1ZP" },
  { name: "Jupiter Medical Equipments",         address: "",              city: "",                   gst: "33AACCV1534D1ZV" },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  await Customer.deleteMany({});
  console.log('🗑️  Cleared existing customers');

  await Customer.insertMany(buyers);
  console.log(`🌱 Seeded ${buyers.length} customers`);

  await mongoose.disconnect();
  console.log('✅ Done');
}

seed().catch(err => { console.error(err); process.exit(1); });
