import * as XLSX from 'xlsx';

/**
 * Exporta dados para Excel com suporte a múltiplas páginas/abas
 * @param {Array} sheets - Array de objetos com estrutura: { name: 'Nome da Aba', data: [], headers: [] }
 * @param {String} fileName - Nome do arquivo (sem extensão)
 */
export const exportToExcel = (sheets, fileName = 'export') => {
  try {
    // Cria um novo workbook
    const workbook = XLSX.utils.book_new();

    sheets.forEach(sheet => {
      // Verifica se há dados
      if (!sheet.data || sheet.data.length === 0) {
        console.warn(`Aba "${sheet.name}" não contém dados`);
        return;
      }

      // Prepara os dados com cabeçalhos
      const wsData = [];
      
      // Adiciona cabeçalhos se fornecidos
      if (sheet.headers && sheet.headers.length > 0) {
        const headerRow = sheet.headers.map(h => h.title || h);
        wsData.push(headerRow);
      }

      // Adiciona os dados
      sheet.data.forEach(row => {
        const dataRow = [];
        if (sheet.headers && sheet.headers.length > 0) {
          sheet.headers.forEach(header => {
            const key = header.key || header;
            dataRow.push(row[key] || '');
          });
        } else {
          // Se não houver headers, usa os valores do objeto na ordem
          dataRow.push(...Object.values(row));
        }
        wsData.push(dataRow);
      });

      // Cria a worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);

      // Define largura das colunas
      const maxWidth = 30;
      const colWidths = wsData[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...wsData.map(row => String(row[colIndex] || '').length)
        );
        return { wch: Math.min(maxLength + 2, maxWidth) };
      });
      worksheet['!cols'] = colWidths;

      // Adiciona a worksheet ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    // Gera o arquivo e faz o download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return false;
  }
};

/**
 * Exporta uma única página/aba para Excel
 * @param {Array} data - Array de objetos com os dados
 * @param {Array} headers - Array de objetos com { title, key }
 * @param {String} fileName - Nome do arquivo (sem extensão)
 */
export const exportSingleSheet = (data, headers, fileName = 'export') => {
  return exportToExcel([{ name: 'Dados', data, headers }], fileName);
};
