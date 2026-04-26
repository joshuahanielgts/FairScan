// Run with: node scripts/generate_samples.mjs
import { writeFileSync, mkdirSync } from 'fs';

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function biasedOutcome(rate) {
  return Math.random() < rate;
}

// Adult Income
const rows1 = [
  'age,workclass,education,marital_status,occupation,sex,race,hours_per_week,income'
];
for (let i = 0; i < 250; i++) {
  const sex = Math.random() < 0.55 ? 'Male' : 'Female';
  const race = sample(['White','White','White','Black','Asian','Hispanic']);
  const age = Math.floor(Math.random() * 47) + 20;
  const workclass = sample(['Private','Self-emp','Government','Private','Private']);
  const education = sample(['Bachelors','HS-grad','Some-college','Masters','Bachelors']);
  const marital = sample(['Married','Never-married','Divorced','Married']);
  const occupation = sample(['Tech-support','Craft','Sales','Exec-managerial','Prof-specialty']);
  const hours = Math.floor(Math.random() * 30) + 30;
  const baseRate = sex === 'Male'
    ? (race === 'Asian' ? 0.30 : race === 'White' ? 0.31 : 0.18)
    : (race === 'Asian' ? 0.22 : race === 'White' ? 0.17 : 0.12);
  const income = biasedOutcome(baseRate) ? '>50K' : '<=50K';
  rows1.push(`${age},${workclass},${education},${marital},${occupation},${sex},${race},${hours},${income}`);
}
mkdirSync('public/samples', { recursive: true });
writeFileSync('public/samples/adult_income.csv', rows1.join('\n'));

// Loan Approval
const rows2 = ['age,income,credit_score,employment_type,gender,loan_amount,loan_term,approved'];
for (let i = 0; i < 200; i++) {
  const gender = Math.random() < 0.55 ? 'Male' : 'Female';
  const age = Math.floor(Math.random() * 40) + 22;
  const income = Math.floor(Math.random() * 80000) + 25000;
  const credit = Math.floor(Math.random() * 350) + 500;
  const employment = sample(['Salaried','Self-employed','Salaried','Government']);
  const loanAmt = Math.floor(Math.random() * 450000) + 50000;
  const term = sample([12, 24, 36, 60, 120]);
  const baseRate = gender === 'Male'
    ? (age < 30 ? 0.55 : 0.70)
    : (age < 30 ? 0.40 : 0.54);
  const approved = biasedOutcome(baseRate) ? '1' : '0';
  rows2.push(`${age},${income},${credit},${employment},${gender},${loanAmt},${term},${approved}`);
}
writeFileSync('public/samples/loan_approval.csv', rows2.join('\n'));

// Hiring
const rows3 = ['age,education,years_experience,gender,race,department,interviewed,hired'];
for (let i = 0; i < 200; i++) {
  const gender = Math.random() < 0.50 ? 'Male' : 'Female';
  const race = sample(['White','White','Black','Asian','Hispanic','White']);
  const age = Math.floor(Math.random() * 30) + 23;
  const edu = sample(['Bachelors','Masters','Bachelors','PhD','Bachelors']);
  const exp = Math.floor(Math.random() * 12) + 1;
  const dept = sample(['Engineering','Marketing','Sales','HR','Finance']);
  const interviewed = Math.random() < 0.7 ? 'yes' : 'no';
  const baseRate = gender === 'Male'
    ? (race === 'White' ? 0.57 : race === 'Asian' ? 0.50 : 0.36)
    : (race === 'White' ? 0.37 : race === 'Asian' ? 0.34 : 0.26);
  const hired = interviewed === 'yes' && biasedOutcome(baseRate) ? 'yes' : 'no';
  rows3.push(`${age},${edu},${exp},${gender},${race},${dept},${interviewed},${hired}`);
}
writeFileSync('public/samples/hiring.csv', rows3.join('\n'));

console.log('Sample CSVs generated in public/samples/');
