/**
 * Calculates the Manhattan distance between two points.
 * @param pointA - The first point.
 * @param pointB - The second point.
 * @returns The Manhattan distance between the two points.
 */
function manhattanDistance(pointA: { x: number; y: number }, pointB: { x: number; y: number }): number {
    return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
}

export { manhattanDistance };