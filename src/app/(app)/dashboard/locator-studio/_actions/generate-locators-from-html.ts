
'use server';

import * as cheerio from 'cheerio';

export type LocatorDetail = {
  type: 'ID' | 'CSS' | 'XPath' | 'Text' | 'Data-TestID' | 'Name' | 'Placeholder' | 'Tag' | 'Class';
  value: string;
};

export type GeneratedElement = {
  elementName: string;
  tagName: string;
  className: string;
  locators: LocatorDetail[];
};

export type GenerateLocatorsOutput = {
  elements: GeneratedElement[];
  formattedCode: string;
  raw: string;
};

export interface GenerateLocatorsFromHtmlInput {
  htmlContent: string;
  framework: 'Playwright' | 'Cypress' | 'Selenium';
  language: 'Java' | 'Python' | 'C#' | 'JavaScript' | 'TypeScript';
}

// --- Helper Functions ---
function toCamelCase(str: string, suffix: string = ''): string {
    if (!str) return '';
    
    const cleanedStr = str
        .replace(/[^a-zA-Z0-9\s_-]/g, ' ') 
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2');

    const s = cleanedStr
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word, index) => {
            if (index === 0) return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');

    let final = s || 'element';
    
    const lowerSuffix = suffix.toLowerCase();
    const lowerFinal = final.toLowerCase();
    
    if (suffix && !lowerFinal.endsWith(lowerSuffix)) {
        final += suffix;
    }
    
    if (final.match(/^\d/)) {
        return `element${final}`;
    }
    return final;
}

function getUniqueElementName(baseName: string, usedNames: Set<string>): string {
    let finalName = baseName;
    let counter = 1;
    while (usedNames.has(finalName)) {
        finalName = `${baseName}${counter}`;
        counter++;
    }
    usedNames.add(finalName);
    return finalName;
}


function getRelativeXPath(el: cheerio.Cheerio, $: cheerio.Root): string {
    const id = el.attr('id');
    if (id) {
        return `//${el[0].tagName}[@id='${id}']`;
    }

    const dataTestId = el.attr('data-testid');
    if (dataTestId) {
        return `//${el[0].tagName}[@data-testid='${dataTestId}']`;
    }
    
    const text = el.text().trim();
    if (text && text.length > 0 && text.length < 50) {
        const isUniqueAmongSiblings = el.siblings().filter((i, sib) => $(sib).text().trim() === text).length === 0;
        if (isUniqueAmongSiblings) {
             return `//${el[0].tagName}[.='${text}']`;
        }
    }

    const className = el.attr('class');
    if(className) {
        return `//${el[0].tagName}[@class='${className}']`;
    }

    // Fallback XPath generation based on index
    const tagName = el[0].tagName;
    let index = 1;
    let sibling = el.prev();
    while (sibling.length > 0) {
        if (sibling[0] && (sibling[0] as any).type === 'tag' && sibling[0].tagName === tagName) {
            index++;
        }
        sibling = sibling.prev();
    }
    return `//${tagName}[${index}]`;
}

export async function formatLocatorsAsCode(locators: GeneratedElement[], framework: string, language: string): Promise<string> {
  const toConstantName = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();

  const getBestLocator = (element: GeneratedElement) => element.locators[0];

  const getByMethod = (type: string, lang: string) => {
    const lower = type.toLowerCase();
    if (lang === 'Java') {
      if (lower.includes('xpath')) return 'xpath';
      if (lower.includes('id')) return 'id';
      if (lower.includes('name')) return 'name';
      return 'cssSelector';
    }
    if (lang === 'Python') {
      if (lower.includes('xpath')) return 'XPATH';
      if (lower.includes('id')) return 'ID';
      if (lower.includes('name')) return 'NAME';
      return 'CSS_SELECTOR';
    }
    if (lang === 'C#') {
      if (lower.includes('xpath')) return 'XPath';
      if (lower.includes('id')) return 'Id';
      if (lower.includes('name')) return 'Name';
      return 'CssSelector';
    }
    return 'css'; // Default for JS-based frameworks
  };
  
   if (framework === 'Playwright' || framework === 'Cypress') {
    const body = locators.map(loc => `  ${loc.elementName}: "${getBestLocator(loc).value.replace(/"/g, '\\"')}"`).join(',\n');
    return `export const locators = {\n${body}\n};`;
  }

  const languageMap = {
    Java: {
      prefix: 'import org.openqa.selenium.By;\n\npublic class PageLocators {\n\n',
      template: (loc: GeneratedElement) => {
        const best = getBestLocator(loc);
        return `    public static final By ${toConstantName(loc.elementName)} = By.${getByMethod(best.type, 'Java')}("${best.value.replace(/"/g, '\\"')}");`
      },
      suffix: '\n}',
    },
    Python: {
      prefix: 'from selenium.webdriver.common.by import By\n\nclass PageLocators:\n',
      template: (loc: GeneratedElement) => {
         const best = getBestLocator(loc);
        return `    ${toConstantName(loc.elementName)} = (By.${getByMethod(best.type, 'Python')}, "${best.value.replace(/"/g, '\\"')}")`
      },
      suffix: '',
    },
    'C#': {
      prefix: 'using OpenQA.Selenium;\n\npublic class PageLocators\n{\n',
      template: (loc: GeneratedElement) => {
         const best = getBestLocator(loc);
        return `    public static readonly By ${loc.elementName} = By.${getByMethod(best.type, 'C#')}("${loc.elementName.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}");`
      },
      suffix: '\n}',
    },
    JavaScript: {
      prefix: '// Selenium WebDriver JS\n\nconst locators = {\n',
      template: (loc: GeneratedElement) => {
        const best = getBestLocator(loc);
        return `    ${loc.elementName}: { ${getByMethod(best.type, 'JavaScript')}: "${best.value.replace(/"/g, '\\"')}" },`
      },
      suffix: '\n};',
    },
  } as const;

  const fmt = languageMap[language as keyof typeof languageMap] || languageMap.Java;
  const body = locators.map(loc => fmt.template(loc)).join('\n');
  return `${fmt.prefix}${body}${fmt.suffix}`;
}

// --- Main Server Action ---

export async function generateLocatorsFromHtml(input: GenerateLocatorsFromHtmlInput): Promise<{ output?: GenerateLocatorsOutput; error?: string }> {
  try {
    const { htmlContent, framework, language } = input;
    const $ = cheerio.load(htmlContent);
    const elements: GeneratedElement[] = [];
    const usedNames = new Set<string>();

    const selector = 'input, button, a, select, textarea, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="radio"], [data-testid]';

    $(selector).each((index, el) => {
      const element = $(el);
      const tagName = el.tagName.toLowerCase();
      const className = element.attr('class') || '';
      
      const locators: LocatorDetail[] = [];
      let nameSource: string | undefined = '';
      let suffix = '';

      // Determine the element type suffix for better naming
      if (tagName === 'button' || element.attr('role') === 'button') suffix = 'Button';
      else if (tagName === 'input') {
          const type = element.attr('type');
          if (type === 'submit') suffix = 'Button';
          else if (type === 'checkbox') suffix = 'Checkbox';
          else if (type === 'radio') suffix = 'Radio';
          else suffix = 'Input';
      }
      else if (tagName === 'a' || element.attr('role') === 'link') suffix = 'Link';
      else if (tagName === 'select') suffix = 'Select';
      else if (tagName === 'textarea') suffix = 'Textarea';
      else if (element.attr('role') === 'tab') suffix = 'Tab';

      // --- Build Locator List (ordered by priority) ---
      const dataTestId = element.attr('data-testid');
      if (dataTestId) {
        locators.push({ type: 'Data-TestID', value: `[data-testid="${dataTestId}"]` });
        nameSource = nameSource || dataTestId;
      }

      const id = element.attr('id');
      if (id) {
        locators.push({ type: 'ID', value: `#${id}` });
        nameSource = nameSource || id;
      }

      const name = element.attr('name');
      if (name) {
        locators.push({ type: 'Name', value: `[name="${name}"]` });
        nameSource = nameSource || name;
      }
      
      const placeholder = element.attr('placeholder');
      if (placeholder) {
          locators.push({ type: 'Placeholder', value: `[placeholder="${placeholder}"]` });
          nameSource = nameSource || placeholder;
      }
      
      const ariaLabel = element.attr('aria-label')?.trim().replace(/\s+/g, ' ');
      const textContent = element.text()?.trim().replace(/\s+/g, ' ').substring(0, 50);
      const text = ariaLabel || textContent;
      
      if (text && framework === 'Playwright') {
          locators.push({ type: 'Text', value: `text=${text}` });
          nameSource = nameSource || text;
      } else if (text) {
          nameSource = nameSource || text;
      }

      if (className) {
          const classes = className.split(' ').filter(c => c && !c.includes(':') && !c.match(/^\d/));
          if(classes.length > 0) {
            locators.push({ type: 'Class', value: `.${classes.join('.')}`});
          }
      }
      
      // CSS Selector as a fallback
      let cssSelector = tagName;
      if (id) {
        cssSelector = `#${id}`;
      } else if (dataTestId) {
        cssSelector = `[data-testid="${dataTestId}"]`;
      } else if (className) {
        const firstClass = className.split(' ').filter(c => c && !c.includes(':') && !c.match(/^\d/))[0];
        if(firstClass) cssSelector += `.${firstClass}`;
      }
      locators.push({ type: 'CSS', value: cssSelector });

      locators.push({ type: 'XPath', value: getRelativeXPath(element, $) });
      
      if (locators.length === 0) return;

      const baseName = toCamelCase(nameSource || tagName, suffix);
      const elementName = getUniqueElementName(baseName || `${tagName}${index}`, usedNames);
      
      elements.push({
        elementName,
        tagName,
        className,
        locators
      });
    });

    if (elements.length === 0) {
        return { error: 'No interactable elements could be found in the provided HTML.' };
    }
    
    const formattedCode = await formatLocatorsAsCode(elements, framework, language);
    const rawJson = JSON.stringify(elements, null, 2);

    return {
      output: {
        elements,
        formattedCode,
        raw: rawJson,
      },
    };

  } catch (error: any) {
    console.error("Error in deterministic locator generation:", error);
    return { error: "An unexpected error occurred while processing the HTML." };
  }
}

    
