export function hasLayoutTag(template: string): boolean {
  return template.includes('<OiyoLayout') || template.includes('<oiyo-layout')
}

export function removeLayoutTag(template: string): string {
  let result = template

  result = result.replace(/<OiyoLayout[^>]*?\/>/g, '')

  result = result.replace(/<OiyoLayout[^>]*>/g, '')
  result = result.replace(/<\/OiyoLayout>/g, '')

  result = result.replace(/<oiyo-layout[^>]*?\/>/g, '')

  result = result.replace(/<oiyo-layout[^>]*>/g, '')
  result = result.replace(/<\/oiyo-layout>/g, '')

  return result
}

export function replaceOiyoLayoutTag(template: string, componentName: string): string {
  let result = template

  result = result.replace(/<OiyoLayout[^>]*?\/>/g, '')

  result = result.replace(/<OiyoLayout[^>]*>/g, `<${componentName}>`)
  result = result.replace(/<\/OiyoLayout>/g, `</${componentName}>`)

  result = result.replace(/<oiyo-layout[^>]*?\/>/g, '')

  result = result.replace(/<oiyo-layout[^>]*>/g, `<${componentName}>`)
  result = result.replace(/<\/oiyo-layout>/g, `</${componentName}>`)

  return result
}

export function wrapWithLayoutTag(template: string, componentName: string): string {
  const content = template
    .replace(/^\s*\n/, '')
    .replace(/\n\s*$/, '')

  return `<${componentName}>\n${content}\n</${componentName}>`
}
