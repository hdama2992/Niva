import 'package:flutter_test/flutter_test.dart';
import 'package:niva/core/app.dart';

void main() {
  testWidgets('moves from splash to login', (WidgetTester tester) async {
    await tester.pumpWidget(const NivaApp());

    expect(find.text('Niva'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 900));
    await tester.pumpAndSettle();

    expect(find.text('Find your people.'), findsOneWidget);
  });
}
