export function formatDifference(
    calculated: number,
    published: number,
    decimalPlaces: number,
): string {
    const roundedCalculated = Number(calculated.toFixed(decimalPlaces));
    const roundedPublished = Number(published.toFixed(decimalPlaces));
    const difference = roundedCalculated - roundedPublished;

    if (difference === 0) {
        return "-";
    }

    const sign = difference > 0 ? "+" : "";

    return `${sign}${difference.toFixed(decimalPlaces)}`;
}

export function printMatrixComparison(
    label: string,
    rowNames: string[],
    columnNames: string[],
    calculated: number[][],
    published: number[][],
    decimalPlaces = 4,
    rowNameLabel = "name",
): void {
    console.log(label);
    console.table(
        rowNames.map((rowName, rowIndex) => {
            const calculatedRow = calculated[rowIndex] ?? [];
            const publishedRow = published[rowIndex] ?? [];
            const differences = columnNames
                .map((columnName, columnIndex) => {
                    const difference = formatDifference(
                        calculatedRow[columnIndex] ?? 0,
                        publishedRow[columnIndex] ?? 0,
                        decimalPlaces,
                    );

                    return difference === "-"
                        ? undefined
                        : `${columnName}: ${difference}`;
                })
                .filter((difference) => difference !== undefined);

            return {
                [rowNameLabel]: rowName,
                calculated: calculatedRow
                    .map((value) => value.toFixed(decimalPlaces))
                    .join(", "),
                pdf: publishedRow
                    .map((value) => value.toFixed(decimalPlaces))
                    .join(", "),
                differences:
                    differences.length === 0
                        ? "-"
                        : differences.join(", "),
            };
        }),
    );
}

export function printVectorComparison(
    label: string,
    names: string[],
    calculated: number[],
    published: number[],
    decimalPlaces = 4,
    nameLabel = "name",
): void {
    console.log(label);
    console.table(
        names.map((name, index) => ({
            [nameLabel]: name,
            calculated: calculated[index]?.toFixed(decimalPlaces),
            pdf: published[index]?.toFixed(decimalPlaces),
            difference: formatDifference(
                calculated[index] ?? 0,
                published[index] ?? 0,
                decimalPlaces,
            ),
        })),
    );
}
