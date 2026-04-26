import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'public', 'samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 1. adult_income.csv
// Bias: Female positive rate ~18%, Male ~32%; Black positive rate ~20%, White ~31%
const adultRows = ['age,workclass,education,marital_status,occupation,sex,race,hours_per_week,income'];
for (let i = 0; i < 200; i++) {
  const age = randInt(18, 70);
  const workclass = randChoice(['Private', 'State-gov', 'Local-gov', 'Self-emp-not-inc']);
  const education = randChoice(['Bachelors', 'HS-grad', '11th', 'Masters', 'Some-college']);
  const marital = randChoice(['Married-civ-spouse', 'Never-married', 'Divorced']);
  const occupation = randChoice(['Tech-support', 'Craft-repair', 'Other-service', 'Sales', 'Exec-managerial']);
  const sex = randChoice(['Male', 'Female']);
  const race = randChoice(['White', 'Black', 'Asian-Pac-Islander', 'Hispanic']);
  const hours = randInt(20, 60);

  let incomeProb = 0.2;
  if (sex === 'Male') incomeProb += 0.14;
  else incomeProb -= 0.02;
  if (race === 'White') incomeProb += 0.08;
  else if (race === 'Black') incomeProb -= 0.02;
  
  const income = Math.random() < incomeProb ? '>50K' : '<=50K';
  adultRows.push([age, workclass, education, marital, occupation, sex, race, hours, income].join(','));
}
fs.writeFileSync(path.join(outDir, 'adult_income.csv'), adultRows.join('\n'));

// 2. loan_approval.csv
// Bias: Female approval rate ~55%, Male ~70%
const loanRows = ['age,income,credit_score,employment_type,gender,approved'];
for (let i = 0; i < 200; i++) {
  const age = randInt(21, 65);
  const income = randInt(30000, 150000);
  const credit = randInt(550, 850);
  const emp = randChoice(['Salaried', 'Self-employed', 'Business']);
  const gender = randChoice(['Male', 'Female']);

  let prob = 0.6;
  if (gender === 'Male') prob += 0.10;
  else prob -= 0.05;

  const approved = Math.random() < prob ? '1' : '0';
  loanRows.push([age, income, credit, emp, gender, approved].join(','));
}
fs.writeFileSync(path.join(outDir, 'loan_approval.csv'), loanRows.join('\n'));

// 3. hiring.csv
// Bias: Female hire rate ~38%, Male ~58%
const hireRows = ['age,education,years_experience,gender,race,hired'];
for (let i = 0; i < 200; i++) {
  const age = randInt(22, 50);
  const education = randChoice(['Bachelors', 'Masters', 'PhD']);
  const exp = randInt(0, 20);
  const gender = randChoice(['Male', 'Female']);
  const race = randChoice(['White', 'Black', 'Asian', 'Hispanic']);

  let prob = 0.45;
  if (gender === 'Male') prob += 0.13;
  else prob -= 0.07;

  const hired = Math.random() < prob ? 'yes' : 'no';
  hireRows.push([age, education, exp, gender, race, hired].join(','));
}
fs.writeFileSync(path.join(outDir, 'hiring.csv'), hireRows.join('\n'));

console.log("Samples generated!");
