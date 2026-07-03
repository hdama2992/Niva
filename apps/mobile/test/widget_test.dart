import 'package:flutter_test/flutter_test.dart';

import 'package:niva/main.dart';

void main() {
  testWidgets('shows the Niva welcome screen', (WidgetTester tester) async {
    await tester.pumpWidget(const NivaApp());

    expect(find.text('Niva'), findsOneWidget);
    expect(find.text('Find your people'), findsOneWidget);
  });
}
