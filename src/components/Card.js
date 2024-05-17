const template = ({ color = '#0D5FC2', cnpj = '', name = '', category = '' }) => {
  return `
<svg width="166" height="101" viewBox="0 0 166 101" fill="none" xmlns="http://www.w3.org/2000/svg">
<style>
@import url("https://fonts.googleapis.com/css?family=Roboto+Condensed:400,400i,700,700i");
</style>
<mask id="path-1-inside-1_125_19412" fill="white">
<path d="M0.5 4C0.5 1.79086 2.29086 0 4.5 0H161.5C163.709 0 165.5 1.79086 165.5 4V97C165.5 99.2091 163.709 101 161.5 101H4.5C2.29086 101 0.5 99.2091 0.5 97V4Z"/>
</mask>
<path d="M0.5 4C0.5 1.79086 2.29086 0 4.5 0H161.5C163.709 0 165.5 1.79086 165.5 4V97C165.5 99.2091 163.709 101 161.5 101H4.5C2.29086 101 0.5 99.2091 0.5 97V4Z" fill="white"/>
<path d="M0.5 0H165.5H0.5ZM165.5 101H0.5H165.5ZM0.5 101V0V101ZM161.5 0C165.918 0 169.5 3.58172 169.5 8V93C169.5 97.4183 165.918 101 161.5 101C161.5 101 161.5 99.2091 161.5 97V4C161.5 1.79086 161.5 0 161.5 0Z" fill="${color}" mask="url(#path-1-inside-1_125_19412)"/>
<rect x="16.5" y="16" width="100" height="22" rx="4" fill="${color}"/>
<text fill="white" xml:space="preserve" style="white-space: pre" font-family="Roboto" font-size="10" font-weight="600" letter-spacing="0px"><tspan x="26" y="30.5">${category}</tspan></text>
<text fill="black" xml:space="preserve" style="white-space: pre" font-family="Roboto" font-size="14" font-weight="600" letter-spacing="0px"><tspan x="16.5" y="60.9">${name}</tspan></text>
<text fill="#666666" xml:space="preserve" style="white-space: pre" font-family="Arial" font-size="12" letter-spacing="0px"><tspan x="16.5" y="83.7">${cnpj}</tspan></text>
 </svg>
`
}


export default template

 