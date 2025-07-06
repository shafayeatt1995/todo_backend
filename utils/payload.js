const userRoles = ["user", "admin", "owner", "staff"];
const packages = [
  {
    id: "1",
    name: "500 SMS",
    price: 299,
    sms: 500,
    bonus: 0,
  },
  {
    id: "2",
    name: "1000 SMS",
    price: 599,
    sms: 1000,
    bonus: 0,
  },
  {
    id: "3",
    name: "2000 SMS",
    price: 1199,
    sms: 2000,
    bonus: 200,
  },
  {
    id: "4",
    name: "5000 SMS",
    price: 2999,
    sms: 5000,
    bonus: 500,
  },
];
module.exports = { userRoles, packages };
