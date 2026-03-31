$tronTsPath = "F:\2025ÇïÇø¿éÁ´Ð­»á\tron-sage\src\lib\tron.ts"
$content = Get-Content $tronTsPath -Raw

$oldStr = @"
      return allTxs
        .filter((tx) => tx.amount >= minUSD)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 30);
"@

$newStr = @"
      const finalTxs = allTxs
        .filter((tx) => tx.amount >= minUSD)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 30);

      if (finalTxs.length === 0) {
        return generateMockWhaleTransactions();
      }

      return finalTxs;
"@

$content = $content.Replace($oldStr, $newStr)
Set-Content $tronTsPath -Value $content
