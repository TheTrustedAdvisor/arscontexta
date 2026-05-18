import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { parseFrontmatter, extractTitle, MIN_DESCRIPTION_LENGTH, MAX_DESCRIPTION_LENGTH } from './shared.js';

interface SchemaValidateOptions {
  filePath: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function schemaValidate(options: SchemaValidateOptions): Promise<string> {
  const { filePath } = options;
  const name = basename(filePath);

  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    return `FAIL: Cannot read file: ${filePath}`;
  }

  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  const fields = parseFrontmatter(content);
  if (!fields) {
    result.valid = false;
    result.errors.push('Missing YAML frontmatter (--- delimiters)');
    return formatResult(name, result);
  }

  const requiredFields = ['description', 'type', 'created'];
  for (const field of requiredFields) {
    if (!fields[field]) {
      result.valid = false;
      result.errors.push(`Missing required field: ${field}`);
    }
  }

  if (fields['description']) {
    if (fields['description'].length < MIN_DESCRIPTION_LENGTH) {
      result.warnings.push(`Description too short (< ${MIN_DESCRIPTION_LENGTH} chars)`);
    }
    if (fields['description'].length > MAX_DESCRIPTION_LENGTH) {
      result.warnings.push(`Description too long (> ${MAX_DESCRIPTION_LENGTH} chars), target ~150`);
    }
  }

  if (fields['type']) {
    const validTypes = ['claim', 'pattern', 'preference', 'fact', 'decision', 'question', 'moc', 'self', 'source'];
    if (!validTypes.includes(fields['type'])) {
      result.warnings.push(`Unknown type: ${fields['type']}. Expected: ${validTypes.join(', ')}`);
    }
  }

  if (fields['created'] && !/^\d{4}-\d{2}-\d{2}$/.test(fields['created'])) {
    result.warnings.push(`Invalid date format: ${fields['created']}. Expected: YYYY-MM-DD`);
  }

  const title = extractTitle(content);
  if (!title) {
    result.warnings.push('No H1 title found');
  } else if (fields['description'] && fields['description'] === title) {
    result.warnings.push('Description is identical to title — should add information beyond the title');
  }

  const hasTopics = /^Topics:/m.test(content) || /^\- \[\[.*\]\]$/m.test(content);
  if (fields['type'] && fields['type'] !== 'moc' && fields['type'] !== 'self' && !hasTopics) {
    result.warnings.push('No Topics section — note should declare MOC membership');
  }

  return formatResult(name, result);
}

function formatResult(name: string, result: ValidationResult): string {
  const status = result.valid ? (result.warnings.length > 0 ? 'WARN' : 'PASS') : 'FAIL';
  const lines = [`${status}: ${name}`];

  for (const error of result.errors) {
    lines.push(`  ✗ ${error}`);
  }
  for (const warning of result.warnings) {
    lines.push(`  ⚠ ${warning}`);
  }

  if (result.errors.length === 0 && result.warnings.length === 0) {
    lines.push('  ✓ All checks passed');
  }

  return lines.join('\n');
}
