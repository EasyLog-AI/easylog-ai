import { XMLParser } from 'fast-xml-parser';

import extractRepeatingElements from './extract-repeating-elements';
import normalizeFieldName from './normalize-field-name';

export interface ProcessedXmlData {
  name: string;
  columns: string[];
  data: Record<string, string | number | boolean | null | undefined>[];
}

const processXmlData = (xmlText: string): ProcessedXmlData => {
  // First, analyze the XML to find repeating elements
  const elementMatches = xmlText.match(/<(\w+)>/g);
  const elementCounts = new Map<string, number>();

  if (elementMatches) {
    elementMatches.forEach((match) => {
      const tagName = match.replace(/[<>]/g, '');
      if (tagName !== '?xml' && !tagName.startsWith('/')) {
        elementCounts.set(tagName, (elementCounts.get(tagName) || 0) + 1);
      }
    });
  }

  // Find the most frequent element (excluding the root dataroot)
  let mostFrequentElement = '';
  let maxCount = 0;
  elementCounts.forEach((count, tagName) => {
    if (tagName !== 'dataroot' && count > maxCount && count > 1) {
      maxCount = count;
      mostFrequentElement = tagName;
    }
  });

  if (!mostFrequentElement) {
    throw new Error('No repeating elements found in XML');
  }

  // Parse XML using fast-xml-parser
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    preserveOrder: false,
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: true
  });

  const xmlDoc = parser.parse(xmlText);

  // Check for parsing errors
  if (!xmlDoc || typeof xmlDoc !== 'object') {
    throw new Error('Failed to parse XML document');
  }

  // Get the root element (should be dataroot, not ?xml)
  const rootElement = Array.isArray(xmlDoc) ? xmlDoc[0] : xmlDoc;
  if (!rootElement || typeof rootElement !== 'object') {
    throw new Error('Invalid XML structure - no root element found');
  }

  // Find the actual root element (skip XML declaration)
  let actualRootElement = null;
  let actualRootElementName = '';

  if (rootElement['?xml']) {
    // XML declaration is present, look for dataroot
    Object.keys(rootElement).forEach((key) => {
      if (key !== '?xml') {
        actualRootElement = rootElement[key];
        actualRootElementName = key;
      }
    });
  } else {
    // No XML declaration, use the first element
    const keys = Object.keys(rootElement);
    if (keys.length > 0) {
      actualRootElementName = keys[0];
      actualRootElement = rootElement[actualRootElementName];
    }
  }

  if (!actualRootElement || typeof actualRootElement !== 'object') {
    throw new Error('Invalid XML structure - no actual root element found');
  }

  // Try to find the repeating elements in the parsed structure
  let records = extractRepeatingElements(
    actualRootElement as Record<string, unknown>,
    mostFrequentElement
  );

  if (records.length === 0) {
    // If no elements found, try a different approach - look for elements that appear multiple times
    const elementOccurrences = new Map<string, Record<string, unknown>[]>();

    Object.entries(actualRootElement).forEach(([key, value]) => {
      if (key !== '@_attributes' && key !== '#text') {
        if (!elementOccurrences.has(key)) {
          elementOccurrences.set(key, []);
        }
        if (Array.isArray(value)) {
          elementOccurrences
            .get(key)!
            .push(...(value as Record<string, unknown>[]));
        } else {
          elementOccurrences.get(key)!.push(value as Record<string, unknown>);
        }
      }
    });

    // Find the element with the most occurrences
    let maxOccurrences = 0;
    let mostOccurringElement = '';

    elementOccurrences.forEach((occurrences, elementName) => {
      if (occurrences.length > maxOccurrences) {
        maxOccurrences = occurrences.length;
        mostOccurringElement = elementName;
      }
    });

    if (maxOccurrences > 1) {
      records = elementOccurrences.get(mostOccurringElement) || [];
      mostFrequentElement = mostOccurringElement;
    }
  }

  if (!records || records.length === 0) {
    throw new Error('No repeating elements found in XML');
  }

  // Convert records to structured data
  const data: Record<string, string | number | boolean | null | undefined>[] =
    [];

  records.forEach((record: Record<string, unknown>) => {
    if (!record || typeof record !== 'object') return;

    const recordData: Record<
      string,
      string | number | boolean | null | undefined
    > = {};

    // Process all properties of this record
    Object.keys(record).forEach((key) => {
      if (key === '@_attributes' || key === '#text') return;

      const fieldName = normalizeFieldName(key);
      let fieldValue = record[key];

      // Handle different value types
      if (fieldValue && typeof fieldValue === 'object') {
        // If it's an object with #text property, use that
        if ('#text' in fieldValue) {
          fieldValue = fieldValue['#text'];
        } else {
          // Skip complex nested objects for now
          return;
        }
      }

      // Convert to string and trim
      const stringValue = String(fieldValue || '').trim();

      // Convert field value to appropriate type
      let processedValue: string | number | boolean | null | undefined;

      if (
        stringValue === '' ||
        stringValue === 'null' ||
        stringValue === 'undefined'
      ) {
        processedValue = null;
      } else if (stringValue === 'true' || stringValue === 'false') {
        processedValue = stringValue === 'true';
      } else if (!isNaN(Number(stringValue)) && stringValue !== '') {
        // Check if it's a valid number
        const num = Number(stringValue);
        if (Number.isInteger(num)) {
          processedValue = num;
        } else {
          processedValue = num;
        }
      } else {
        // Try to parse as date
        const dateValue = new Date(stringValue);
        if (!isNaN(dateValue.getTime()) && stringValue.includes('-')) {
          processedValue = dateValue.toISOString();
        } else {
          processedValue = stringValue;
        }
      }

      recordData[fieldName] = processedValue;
    });

    data.push(recordData);
  });

  // Get all unique field names from all records
  const allFields = new Set<string>();
  data.forEach((record) => {
    Object.keys(record).forEach((field) => allFields.add(field));
  });

  const columns = Array.from(allFields);

  // Ensure all records have all fields (fill missing with null)
  const normalizedData = data.map((record) => {
    const normalized: Record<
      string,
      string | number | boolean | null | undefined
    > = {};
    columns.forEach((column) => {
      normalized[column] = record[column] ?? null;
    });
    return normalized;
  });

  return {
    name: mostFrequentElement,
    columns,
    data: normalizedData
  };
};

export default processXmlData;
