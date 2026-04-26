// Run with: node scripts/generate_samples.mjs
import { writeFileSync, mkdirSync } from 'fs';

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function biasedOutcome(rate) {
  return Math.random() < rate;
}

mkdirSync('public/samples', { recursive: true });

// 1. Adult Income (Large)
const rows1 = [
  'age,workclass,education,marital_status,occupation,sex,race,hours_per_week,income'
];
for (let i = 0; i < 1200; i++) {
  const sex = Math.random() < 0.55 ? 'Male' : 'Female';
  const race = sample(['White','White','White','Black','Asian','Hispanic']);
  const age = Math.floor(Math.random() * 50) + 18;
  const workclass = sample(['Private','Self-emp','Government','Private','Private']);
  const education = sample(['Bachelors','HS-grad','Some-college','Masters','Bachelors','Doctorate']);
  const marital = sample(['Married','Never-married','Divorced','Married']);
  const occupation = sample(['Tech-support','Craft','Sales','Exec-managerial','Prof-specialty']);
  const hours = Math.floor(Math.random() * 40) + 20;
  const baseRate = sex === 'Male'
    ? (race === 'Asian' ? 0.35 : race === 'White' ? 0.32 : 0.20)
    : (race === 'Asian' ? 0.25 : race === 'White' ? 0.19 : 0.14);
  const income = biasedOutcome(baseRate) ? '>100K' : '<=100K';
  rows1.push(`${age},${workclass},${education},${marital},${occupation},${sex},${race},${hours},${income}`);
}
writeFileSync('public/samples/adult_income.csv', rows1.join('\n'));

// 2. Loan Approval (Large)
const rows2 = ['age,annual_income,credit_score,employment_type,gender,loan_amount,loan_term_months,approved'];
for (let i = 0; i < 1000; i++) {
  const gender = Math.random() < 0.52 ? 'Male' : 'Female';
  const age = Math.floor(Math.random() * 45) + 21;
  const income = Math.floor(Math.random() * 250000) + 45000;
  const credit = Math.floor(Math.random() * 450) + 400;
  const employment = sample(['Salaried','Self-employed','Salaried','Government','Contractor']);
  const loanAmt = Math.floor(Math.random() * 1500000) + 100000;
  const term = sample([12, 24, 36, 48, 60, 120, 180, 360]);
  const baseRate = gender === 'Male'
    ? (age < 30 ? 0.58 : 0.72)
    : (age < 30 ? 0.42 : 0.56);
  const approved = biasedOutcome(baseRate) ? '1' : '0';
  rows2.push(`${age},${income},${credit},${employment},${gender},${loanAmt},${term},${approved}`);
}
writeFileSync('public/samples/loan_approval.csv', rows2.join('\n'));

// 3. Hiring (Large)
const rows3 = ['age,education,years_experience,gender,race,department,interviewed,hired'];
for (let i = 0; i < 1000; i++) {
  const gender = Math.random() < 0.50 ? 'Male' : 'Female';
  const race = sample(['White','White','Black','Asian','Hispanic','White']);
  const age = Math.floor(Math.random() * 35) + 22;
  const edu = sample(['Bachelors','Masters','Bachelors','PhD','Bachelors','Some-college']);
  const exp = Math.floor(Math.random() * 20) + 0;
  const dept = sample(['Engineering','Marketing','Sales','HR','Finance','Legal']);
  const interviewed = Math.random() < 0.75 ? 'yes' : 'no';
  const baseRate = gender === 'Male'
    ? (race === 'White' ? 0.60 : race === 'Asian' ? 0.52 : 0.38)
    : (race === 'White' ? 0.40 : race === 'Asian' ? 0.36 : 0.28);
  const hired = interviewed === 'yes' && biasedOutcome(baseRate) ? 'yes' : 'no';
  rows3.push(`${age},${edu},${exp},${gender},${race},${dept},${interviewed},${hired}`);
}
writeFileSync('public/samples/hiring.csv', rows3.join('\n'));

// 4. Credit Risk (Extra Large - 2000 rows)
const rows4 = ['age,income,assets,credit_history,employment_years,gender,residence_type,risk_score,default'];
for (let i = 0; i < 2000; i++) {
  const gender = Math.random() < 0.50 ? 'Male' : 'Female';
  const age = Math.floor(Math.random() * 50) + 20;
  const income = Math.floor(Math.random() * 500000) + 30000;
  const assets = Math.floor(Math.random() * 1000000) + 10000;
  const history = sample(['good','poor','fair','good','excellent']);
  const exp = Math.floor(Math.random() * 25);
  const residence = sample(['own','rent','mortgage','own']);
  const risk = Math.floor(Math.random() * 1000);
  
  const baseRate = gender === 'Male' ? 0.12 : 0.22; // Females defaulted more in this synthetic biased data
  const isDefault = biasedOutcome(baseRate) ? '1' : '0';
  rows4.push(`${age},${income},${assets},${history},${exp},${gender},${residence},${risk},${isDefault}`);
}
writeFileSync('public/samples/credit_risk_large.csv', rows4.join('\n'));

console.log('Large Sample CSVs generated in public/samples/');

